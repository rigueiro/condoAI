import { NextResponse } from "next/server";
import {
  createResetToken,
  isKnownAccount,
} from "@/lib/server/auth";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError, jsonOk } from "@/lib/server/http";
import { routing, type Locale } from "@/i18n/routing";

function localeFromRequest(request: Request): Locale {
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const segment = new URL(referer).pathname.split("/").filter(Boolean)[0];
      if (segment && (routing.locales as readonly string[]).includes(segment)) {
        return segment as Locale;
      }
    } catch {
      // Malformed Referer — fall through to the default locale.
    }
  }
  return routing.defaultLocale;
}

export const POST = apiRoute(async (request) => {
  if (isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
  }
  // Never reveal whether the account exists, and never return the token.
  if (isKnownAccount(email)) {
    const { token } = createResetToken(email);
    if (process.env.NODE_ENV === "development") {
      const origin = new URL(request.url).origin;
      const locale = localeFromRequest(request);
      console.info(
        `[CondoAI demo] Password reset link for ${email}: ${origin}/${locale}/reset-password?token=${token}`,
      );
    }
  }
  return jsonOk({});
});
