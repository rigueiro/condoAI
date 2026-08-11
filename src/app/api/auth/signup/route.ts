import { NextResponse } from "next/server";
import { registerAccount } from "@/lib/server/auth";
import {
  applySessionCookie,
  createSession,
} from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
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
    const response = jsonOk({ user });
    applySessionCookie(response, sessionId, rememberMe);
    return response;
  } catch (err) {
    return handleRouteError(err);
  }
}
