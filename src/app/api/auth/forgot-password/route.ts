import { NextResponse } from "next/server";
import {
  createResetToken,
  isKnownAccount,
} from "@/lib/server/auth";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError, jsonOk } from "@/lib/server/http";

export const POST = apiRoute(async (request) => {
  if (isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
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
});
