"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import SectionCard from "@/components/ui/section-card";

import HelpSearch from "./components/help-search";
import HelpCategories, {
  type HelpCategory,
} from "./components/help-categories";
import FaqSection from "./components/faq-section";
import ContactSupportSection from "./components/contact-support-section";
import ResourcesSection, {
  type HelpResource,
} from "./components/resources-section";

const CATEGORIES: HelpCategory[] = [
  {
    id: "gettingStarted",
    icon: "Rocket",
    articleCount: 12,
    accent: "primary",
  },
  { id: "properties", icon: "Building2", articleCount: 18, accent: "accent" },
  { id: "owners", icon: "Users", articleCount: 14, accent: "success" },
  { id: "payments", icon: "CreditCard", articleCount: 22, accent: "warning" },
  { id: "reports", icon: "BarChart3", articleCount: 9, accent: "secondary" },
  { id: "account", icon: "Settings", articleCount: 11, accent: "error" },
];

const FAQ_ITEMS = [
  { id: "resetPassword" },
  { id: "inviteTeam" },
  { id: "importPayments" },
  { id: "changePlan" },
  { id: "exportData" },
  { id: "languages" },
];

const RESOURCES: HelpResource[] = [
  {
    id: "docs",
    icon: "BookOpen",
    href: "https://condoai.pt/docs",
  },
  {
    id: "videos",
    icon: "Play",
    href: "https://condoai.pt/videos",
  },
  {
    id: "changelog",
    icon: "Sparkles",
    href: "https://condoai.pt/changelog",
  },
  {
    id: "status",
    icon: "Activity",
    href: "https://status.condoai.pt",
  },
  {
    id: "community",
    icon: "Users",
    href: "https://community.condoai.pt",
  },
  {
    id: "roadmap",
    icon: "Map",
    href: "https://condoai.pt/roadmap",
  },
];

const APP_VERSION = "1.0.0";

function HelpPage() {
  const t = useTranslations("help");
  const tCategories = useTranslations("help.categories.items");
  const tFaqItems = useTranslations("help.faq.items");
  const tSystem = useTranslations("help.system");

  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return CATEGORIES;
    return CATEGORIES.filter((category) => {
      const title = tCategories(`${category.id}.title`).toLowerCase();
      const description = tCategories(
        `${category.id}.description`,
      ).toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, tCategories]);

  const filteredFaq = useMemo(() => {
    if (!normalizedQuery) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => {
      const question = tFaqItems(`${item.id}.question`).toLowerCase();
      const answer = tFaqItems(`${item.id}.answer`).toLowerCase();
      return (
        question.includes(normalizedQuery) ||
        answer.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, tFaqItems]);

  const totalResults = filteredCategories.length + filteredFaq.length;
  const showEmptyState = Boolean(normalizedQuery) && totalResults === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 pb-8">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8 text-center max-w-2xl mx-auto">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-primary text-white items-center justify-center mb-4">
              <Icon name="LifeBuoy" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary">{t("subtitle")}</p>
          </div>

          <div className="max-w-2xl mx-auto mb-6">
            <HelpSearch value={query} onChange={setQuery} />
            {normalizedQuery && !showEmptyState && (
              <p className="mt-3 text-center text-sm text-text-secondary">
                {t("search.resultsTitle", {
                  count: totalResults,
                  query,
                })}
              </p>
            )}
          </div>

          {showEmptyState ? (
            <div className="bg-surface rounded-lg shadow-card border border-border-light p-10 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary-100 flex items-center justify-center text-text-secondary">
                <Icon name="SearchX" size={20} />
              </div>
              <h2 className="mt-3 text-sm font-medium text-text-primary">
                {t("search.noResults", { query })}
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                {t("search.noResultsHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCategories.length > 0 && (
                <SectionCard
                  title={t("categories.title")}
                  description={t("categories.subtitle")}
                >
                  <HelpCategories categories={filteredCategories} />
                </SectionCard>
              )}

              {filteredFaq.length > 0 && (
                <SectionCard
                  title={t("faq.title")}
                  description={t("faq.subtitle")}
                >
                  <FaqSection items={filteredFaq} />
                </SectionCard>
              )}

              {!normalizedQuery && (
                <SectionCard
                  title={t("contact.title")}
                  description={t("contact.subtitle")}
                >
                  <ContactSupportSection />
                </SectionCard>
              )}

              {!normalizedQuery && (
                <SectionCard
                  title={t("resources.title")}
                  description={t("resources.subtitle")}
                >
                  <ResourcesSection resources={RESOURCES} />
                </SectionCard>
              )}
            </div>
          )}

          <footer className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="font-medium text-success">
                {tSystem("allOperational")}
              </span>
            </div>
            <span>{tSystem("version", { version: APP_VERSION })}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default HelpPage;
