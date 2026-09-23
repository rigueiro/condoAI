import { NextResponse } from "next/server";
import {
  consumeResetToken,
  peekResetToken,
} from "@/lib/server/auth";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import {
  clearSessionCookie,
  destroySession,
  readSessionId,
} from "@/lib/server/session";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError, jsonOk } from "@/lib/server/http";

export const GET = apiRoute(async (request) => {
  if (isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json(
      { error: "invalidResetToken" },
      { status: 400 },
    );
  }
  const { email } = peekResetToken(token);
  return jsonOk({ email });
});

export const POST = apiRoute(async (request) => {
  if (isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  const body = (await request.json()) as {
    token?: string;
    newPassword?: string;
  };
  const token = body.token ?? "";
  const newPassword = body.newPassword ?? "";
  consumeResetToken(token, newPassword);
  const sessionId = await readSessionId();
  destroySession(sessionId);
  const response = jsonOk({ ok: true });
  clearSessionCookie(response);
  return response;
});
