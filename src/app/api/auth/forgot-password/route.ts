import { NextResponse } from "next/server";
import {
  createResetToken,
  isKnownAccount,
} from "@/lib/server/auth";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";
    if (!email) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
    }
    // Never reveal whether the account exists.
    if (!isKnownAccount(email)) {
      return jsonOk({});
    }
    const { token } = createResetToken(email);
    return jsonOk({ demoResetToken: token });
  } catch (err) {
    return handleRouteError(err);
  }
}
