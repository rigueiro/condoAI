"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  canPortal,
  roleDisplayKey,
  type PortalAction,
} from "@/lib/memberships";
import PortalShell from "./components/portal-shell";
import { usePortalCondo } from "./components/use-portal-condo";

const CARD_LINK_CLASS =
  "rounded-lg border border-border-light bg-surface p-6 transition-smooth hover:border-primary-100";

type HomeCard = {
  action: PortalAction;
  path: string;
  titleKey: "extractCard" | "documentsCard" | "occurrencesCard" | "announcementsCard" | "budgetCard";
  hintKey: "extractHint" | "documentsHint" | "occurrencesHint" | "announcementsHint" | "budgetHint";
};

const HOME_CARDS: HomeCard[] = [
  {
    action: "readExtract",
    path: "/portal/extract",
    titleKey: "extractCard",
    hintKey: "extractHint",
  },
  {
    action: "readDocuments",
    path: "/portal/documents",
    titleKey: "documentsCard",
    hintKey: "documentsHint",
  },
  {
    action: "readOccurrences",
    path: "/portal/occurrences",
    titleKey: "occurrencesCard",
    hintKey: "occurrencesHint",
  },
  {
    action: "readAnnouncements",
    path: "/portal/announcements",
    titleKey: "announcementsCard",
    hintKey: "announcementsHint",
  },
  {
    action: "readBudget",
    path: "/portal/budget",
    titleKey: "budgetCard",
    hintKey: "budgetHint",
  },
];

export default function PortalHomePage() {
  const t = useTranslations("portal");
  const tRoles = useTranslations("portal.roles");
  const { selected } = usePortalCondo();
  const condoQs = selected ? `?condo=${selected.condominiumId}` : "";

  const cards = useMemo(() => {
    if (!selected) return [];
    return HOME_CARDS.filter((card) => canPortal(selected.role, card.action));
  }, [selected]);

  return (
    <PortalShell title={t("home.title")} subtitle={t("home.subtitle")}>
      {selected && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.path}
              href={`${card.path}${condoQs}`}
              className={CARD_LINK_CLASS}
            >
              <h2 className="text-base font-semibold text-text-primary">
                {t(`home.${card.titleKey}`)}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {card.action === "readExtract" && !selected.ownerId
                  ? t("home.extractUnavailable")
                  : t(`home.${card.hintKey}`, {
                      name: selected.ownerName ?? "",
                    })}
              </p>
            </Link>
          ))}
          <div className="rounded-lg border border-border-light bg-surface p-6 sm:col-span-2">
            <h2 className="text-base font-semibold text-text-primary">
              {selected.condominiumName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{selected.address}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-text-secondary">{t("home.role")}</dt>
                <dd className="font-medium text-text-primary">
                  {tRoles(roleDisplayKey(selected.role))}
                </dd>
              </div>
              {selected.unitLabels.length > 0 && (
                <div>
                  <dt className="text-text-secondary">{t("home.units")}</dt>
                  <dd className="font-medium text-text-primary">
                    {selected.unitLabels.join(", ")}
                  </dd>
                </div>
              )}
              {selected.ownerName && (
                <div>
                  <dt className="text-text-secondary">{t("home.linkedOwner")}</dt>
                  <dd className="font-medium text-text-primary">
                    {selected.ownerName}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
