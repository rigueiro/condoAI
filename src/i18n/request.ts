import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageNamespaces = [
  "common",
  "login",
  "home",
  "auth",
  "dashboard",
  "propertiesManagement",
  "ownersManagement",
  "paymentTracking",
  "reportsAnalytics",
  "occurrences",
] as const;

const messageFiles: Record<(typeof messageNamespaces)[number], string> = {
  common: "common",
  login: "login",
  home: "home",
  auth: "auth",
  dashboard: "dashboard",
  propertiesManagement: "properties-management",
  ownersManagement: "owners-management",
  paymentTracking: "payment-tracking",
  reportsAnalytics: "reports-analytics",
  occurrences: "occurrences",
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages: Record<string, unknown> = {};

  for (const namespace of messageNamespaces) {
    const file = messageFiles[namespace];
    messages[namespace] = (
      await import(`../../messages/${locale}/${file}.json`)
    ).default;
  }

  return { locale, messages };
});
