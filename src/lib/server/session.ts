import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  isPlaygroundMode,
  PLAYGROUND_TTL_SECONDS,
} from "./playground-mode";
import {
  readStore,
  updateStore,
  type StoredSession,
} from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DAYS_REMEMBER = 30;
const SESSION_DAYS_DEFAULT = 1;

export function createSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function createSession(
  email: string,
  rememberMe: boolean,
): { sessionId: string; session: StoredSession } {
  const sessionId = createSessionId();
  const session: StoredSession = {
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
    rememberMe,
  };
  updateStore((store) => {
    store.sessions[sessionId] = session;
  });
  return { sessionId, session };
}

export function destroySession(sessionId: string | undefined | null): void {
  if (!sessionId) return;
  updateStore((store) => {
    delete store.sessions[sessionId];
  });
}

export function getSessionFromStore(
  sessionId: string | undefined | null,
): StoredSession | null {
  if (!sessionId) return null;
  const store = readStore();
  const session = store.sessions[sessionId];
  if (!session) return null;
  const maxAge = session.rememberMe
    ? SESSION_DAYS_REMEMBER * DAY_MS
    : SESSION_DAYS_DEFAULT * DAY_MS;
  if (Date.now() - session.createdAt > maxAge) {
    destroySession(sessionId);
    return null;
  }
  return session;
}

export function cookieMaxAge(rememberMe: boolean): number {
  if (isPlaygroundMode()) return PLAYGROUND_TTL_SECONDS;
  return (rememberMe ? SESSION_DAYS_REMEMBER : SESSION_DAYS_DEFAULT) * 24 * 60 * 60;
}

export function applySessionCookie(
  response: NextResponse,
  sessionId: string,
  rememberMe: boolean,
): void {
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMaxAge(rememberMe),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Read session id from a Route Handler request (via next/headers cookies). */
export async function readSessionId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function readSessionIdFromRequest(
  request: NextRequest,
): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function requireSessionEmail(): Promise<string> {
  const sessionId = await readSessionId();
  const session = getSessionFromStore(sessionId);
  if (!session) {
    throw new AuthRequiredError();
  }
  return session.email;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "AuthRequiredError";
  }
}
