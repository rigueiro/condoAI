import { NextResponse } from "next/server";
import { loginUser } from "@/lib/server/auth";
import {
  applySessionCookie,
  createSession,
} from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
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
    const user = loginUser(email, password);
    const rememberMe = Boolean(body.rememberMe);
    const { sessionId } = createSession(user.email, rememberMe);
    const response = jsonOk({ user });
    applySessionCookie(response, sessionId, rememberMe);
    return response;
  } catch (err) {
    return handleRouteError(err);
  }
}
