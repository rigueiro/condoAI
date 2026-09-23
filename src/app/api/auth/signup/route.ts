import { NextResponse } from "next/server";
import { registerAccount } from "@/lib/server/auth";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import {
  applySessionCookie,
  createSession,
} from "@/lib/server/session";
import { rebindPlaygroundSession } from "@/lib/server/playground-store";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError, jsonOk } from "@/lib/server/http";

export const POST = apiRoute(async (request) => {
  if (isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "signupFailed" },
      { status: 400 },
    );
  }
  const user = registerAccount(name, email, password);
  const rememberMe = body.rememberMe !== false;
  const { sessionId } = createSession(user.email, rememberMe);
  rebindPlaygroundSession(sessionId);
  const response = jsonOk({ user });
  applySessionCookie(response, sessionId, rememberMe);
  return response;
});
