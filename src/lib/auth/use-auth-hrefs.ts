"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import { localeHref } from "@/i18n/locale-href";

/** Locale-aware auth route hrefs (full navigation). */
export function useAuthHrefs() {
  const locale = useLocale();

  return useMemo(
    () => ({
      login: localeHref(locale, "/login"),
      signup: localeHref(locale, "/signup"),
      onboarding: localeHref(locale, "/onboarding"),
      forgotPassword: localeHref(locale, "/forgot-password"),
      resetPassword: (token: string) =>
        localeHref(locale, "/reset-password", { token }),
      absoluteResetPassword: (token: string) => {
        const path = localeHref(locale, "/reset-password", { token });
        if (typeof window === "undefined") return path;
        return `${window.location.origin}${path}`;
      },
    }),
    [locale],
  );
}
