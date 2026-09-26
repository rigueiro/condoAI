import { NextResponse } from "next/server";
import { loginUser } from "@/lib/server/auth";
import { ensureDemoWorkspace } from "@/lib/server/demo";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { startPlaygroundSession } from "@/lib/server/playground-session";
import {
  applySessionCookie,
  createSession,
} from "@/lib/server/session";
import { apiRoute } from "@/lib/server/api-route";
import { jsonOk, jsonRateLimited } from "@/lib/server/http";
import { enforceRateLimit, resetRateLimit } from "@/lib/server/rate-limit";

export const POST = apiRoute(async (request) => {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "invalidCredentials" },
      { status: 400 },
    );
  }
  const limited = enforceRateLimit(request, "login", email);
  if (!limited.ok) {
    return jsonRateLimited(limited.retryAfterSec);
  }
  if (isPlaygroundMode()) {
    loginUser(email, password);
    resetRateLimit(limited.pairKey);
    return startPlaygroundSession(email);
  }
  const user = loginUser(email, password);
  resetRateLimit(limited.pairKey);
  ensureDemoWorkspace(user.email);
  const rememberMe = Boolean(body.rememberMe);
  const { sessionId } = createSession(user.email, rememberMe);
  const response = jsonOk({ user });
  applySessionCookie(response, sessionId, rememberMe);
  return response;
});
