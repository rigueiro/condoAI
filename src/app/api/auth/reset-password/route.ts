import { NextResponse } from "next/server";
import {
  consumeResetToken,
  peekResetToken,
} from "@/lib/server/auth";
import {
  clearSessionCookie,
  destroySession,
  readSessionId,
} from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) {
      return NextResponse.json(
        { error: "invalidResetToken" },
        { status: 400 },
      );
    }
    const { email } = peekResetToken(token);
    return jsonOk({ email });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (err) {
    return handleRouteError(err);
  }
}
