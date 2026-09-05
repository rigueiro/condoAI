import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageNamespaces = [
  "common",
  "login",
  "signup",
  "home",
  "auth",
  "dashboard",
  "onboarding",
  "propertiesManagement",
  "ownersManagement",
  "paymentTracking",
  "reportsAnalytics",
  "occurrences",
  "compliance",
  "finance",
  "profile",
  "account",
  "help",
  "currentAccount",
  "assemblies",
  "portal",
  "operations",
  "documents",
  "announcements",
  "works",
] as const;

const messageFiles: Record<(typeof messageNamespaces)[number], string> = {
  common: "common",
  login: "login",
  signup: "signup",
  home: "home",
  auth: "auth",
  dashboard: "dashboard",
  onboarding: "onboarding",
  propertiesManagement: "properties-management",
  ownersManagement: "owners-management",
  paymentTracking: "payment-tracking",
  reportsAnalytics: "reports-analytics",
  occurrences: "occurrences",
  compliance: "compliance",
  finance: "finance",
  profile: "profile",
  account: "account",
  help: "help",
  currentAccount: "current-account",
  assemblies: "assemblies",
  portal: "portal",
  operations: "operations",
  documents: "documents",
  announcements: "announcements",
  works: "works",
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
