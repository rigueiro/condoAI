"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { formatIsoDate } from "@/lib/collections/dates";
import { buildingWorkspaceHref, usePortfolio } from "@/lib/portfolio";
import { buildMandateAttention, useBoard } from "@/lib/board";

function MandateAttention() {
  const t = useTranslations("board.attention");
  const locale = useLocale();
  const { portfolio } = usePortfolio();
  const { mandates, isReady } = useBoard();

  const items = useMemo(
    () =>
      buildMandateAttention(
        mandates,
        portfolio.condominiums,
        portfolio.owners,
      ),
    [mandates, portfolio.condominiums, portfolio.owners],
  );

  if (!isReady || items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-light bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">
        {t("title")}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={buildingWorkspaceHref(item.condominiumId, "board")}
              className="block rounded-lg border border-border-light p-3 transition-smooth hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-50">
                  <Icon
                    name="Users"
                    size={18}
                    color="var(--color-warning)"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {item.condominiumName}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {item.kind === "missing"
                      ? t("missing")
                      : item.kind === "expired"
                        ? t("expired", {
                            date: item.endsOn
                              ? formatIsoDate(item.endsOn, locale)
                              : "—",
                          })
                        : t("expiring", {
                            date: item.endsOn
                              ? formatIsoDate(item.endsOn, locale)
                              : "—",
                          })}
                    {item.presidenteName ? ` · ${item.presidenteName}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-primary">
                  {t("open")}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MandateAttention;
