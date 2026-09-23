import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/auth/constants";
import { routing } from "./i18n/routing";
import { isPlaygroundMode } from "./lib/server/playground-mode";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = new Set([
  "",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "help",
]);

const AUTH_ONLY_PATHS = new Set(["login", "signup"]);
const PLAYGROUND_BLOCKED_PATHS = new Set([
  "signup",
  "forgot-password",
  "reset-password",
]);

function stripLocale(pathname: string): {
  locale: string | null;
  rest: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];
  if (maybeLocale === "en" || maybeLocale === "pt") {
    return {
      locale: maybeLocale,
      rest: parts.slice(1).join("/"),
    };
  }
  return { locale: null, rest: parts.join("/") };
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, rest } = stripLocale(pathname);
  const segment = rest.split("/")[0] ?? "";
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const effectiveLocale = locale ?? routing.defaultLocale;
  const isPublic = PUBLIC_PATHS.has(segment) || rest === "";

  if (isPlaygroundMode() && PLAYGROUND_BLOCKED_PATHS.has(segment)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${effectiveLocale}/login`;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (!hasSession && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${effectiveLocale}/login`;
    loginUrl.searchParams.set(
      "next",
      pathname + (request.nextUrl.search || ""),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && AUTH_ONLY_PATHS.has(segment)) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = request.nextUrl.clone();
    if (next && next.startsWith("/")) {
      dest.href = new URL(next, request.url).href;
      return NextResponse.redirect(dest);
    }
    dest.pathname = `/${effectiveLocale}/dashboard`;
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return intlMiddleware(request);
}

export const config = {
  // API routes authenticate themselves — skip middleware overhead.
  matcher: ["/", "/(pt|en)/:path*"],
};
