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

function redisEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  const env = redisEnv();
  if (!env) return null;
  const response = await fetch(env.url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error("playgroundUnavailable");
  }
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) {
    throw new Error("playgroundUnavailable");
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
