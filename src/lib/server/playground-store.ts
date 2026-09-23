import { request as httpsRequest } from "node:https";
import { URL } from "node:url";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  isPlaygroundMode,
  PLAYGROUND_TTL_SECONDS,
} from "./playground-mode";
import {
  cloneEmptyStore,
  hydrateStoreDocument,
  playgroundAls,
  type StoreDocument,
} from "./store";

const REDIS_KEY_PREFIX = "condoai:playground:";

type MemoryEntry = { doc: StoreDocument; expiresAt: number };

const memoryStores = new Map<string, MemoryEntry>();

function redisKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}${sessionId}`;
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw
    .trim()
    .replace(/^[\s\u201c\u201d\u2018\u2019"']+|[\s\u201c\u201d\u2018\u2019"']+$/g, "")
    .trim();
  return value || undefined;
}

function redisEnv(): { url: string; token: string } | null {
  const url = readEnv("UPSTASH_REDIS_REST_URL");
  const token = readEnv("UPSTASH_REDIS_REST_TOKEN")?.replace(/^Bearer\s+/i, "");
  if (!url || !token) return null;
  return { url, token };
}

function playgroundUnavailable(redisStatus?: number): Error {
  const err = new Error("playgroundUnavailable") as Error & {
    redisStatus?: number;
  };
  if (redisStatus) err.redisStatus = redisStatus;
  return err;
}

function redisPost(
  url: string,
  token: string,
  command: unknown[],
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const endpoint = new URL(url);
    const payload = Buffer.from(JSON.stringify(command));
    const req = httpsRequest(
      {
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || 443,
        path: endpoint.pathname && endpoint.pathname !== "" ? endpoint.pathname : "/",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  const env = redisEnv();
  if (!env) return null;
  let response: { status: number; body: string };
  try {
    response = await redisPost(env.url, env.token, command);
  } catch {
    throw playgroundUnavailable();
  }
  if (response.status < 200 || response.status >= 300) {
    throw playgroundUnavailable(response.status);
  }
  let payload: { result?: unknown; error?: string };
  try {
    payload = JSON.parse(response.body) as {
      result?: unknown;
      error?: string;
    };
  } catch {
    throw playgroundUnavailable(response.status);
  }
  if (payload.error) {
    throw playgroundUnavailable(response.status);
  }
  return payload.result ?? null;
}

function readMemory(sessionId: string): StoreDocument | null {
  const entry = memoryStores.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStores.delete(sessionId);
    return null;
  }
  return structuredClone(entry.doc);
}

function writeMemory(sessionId: string, doc: StoreDocument): void {
  memoryStores.set(sessionId, {
    doc: structuredClone(doc),
    expiresAt: Date.now() + PLAYGROUND_TTL_SECONDS * 1000,
  });
}

async function loadPlaygroundDocument(
  sessionId: string,
): Promise<StoreDocument | null> {
  if (redisEnv()) {
    const raw = await redisCommand(["GET", redisKey(sessionId)]);
    if (raw == null) return null;
    if (typeof raw === "string") {
      return hydrateStoreDocument(JSON.parse(raw) as Partial<StoreDocument>);
    }
    if (typeof raw === "object") {
      return hydrateStoreDocument(raw as Partial<StoreDocument>);
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("playgroundUnavailable");
  }
  return readMemory(sessionId);
}

async function savePlaygroundDocument(
  sessionId: string,
  doc: StoreDocument,
): Promise<void> {
  if (redisEnv()) {
    await redisCommand([
      "SET",
      redisKey(sessionId),
      JSON.stringify(doc),
      "EX",
      PLAYGROUND_TTL_SECONDS,
    ]);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("playgroundUnavailable");
  }
  writeMemory(sessionId, doc);
}

async function deletePlaygroundDocument(sessionId: string): Promise<void> {
  if (redisEnv()) {
    await redisCommand(["DEL", redisKey(sessionId)]);
    return;
  }
  memoryStores.delete(sessionId);
}

export function sessionIdFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    if (!value) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

export function rebindPlaygroundSession(sessionId: string): void {
  const ctx = playgroundAls.getStore();
  if (!ctx) return;
  ctx.sessionId = sessionId;
  ctx.dirty = true;
}

export function dropPlaygroundSession(): void {
  const ctx = playgroundAls.getStore();
  if (!ctx) return;
  ctx.drop = true;
  ctx.dirty = false;
}

export async function withPlaygroundStore<T>(
  request: Request | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isPlaygroundMode()) {
    return fn();
  }

  const cookieId = sessionIdFromCookieHeader(request?.headers.get("cookie"));
  let sessionId: string | null = cookieId ?? null;
  let doc = cloneEmptyStore();

  if (cookieId) {
    const existing = await loadPlaygroundDocument(cookieId);
    if (existing) {
      doc = existing;
    } else {
      sessionId = null;
    }
  }

  const ctx = {
    doc,
    dirty: false,
    sessionId,
    drop: false,
  };

  return playgroundAls.run(ctx, async () => {
    try {
      return await fn();
    } finally {
      if (ctx.drop && cookieId) {
        await deletePlaygroundDocument(cookieId);
      } else if (ctx.dirty && ctx.sessionId) {
        await savePlaygroundDocument(ctx.sessionId, ctx.doc);
      }
    }
  });
}
