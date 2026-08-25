"use client";

import { useTranslations } from "next-intl";
import type { PortalOccurrence } from "@/lib/memberships";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";

type OccurrencesResponse = {
  occurrences: PortalOccurrence[];
};

export default function PortalOccurrencesPage() {
  const t = useTranslations("portal");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");
  const { condominiumId } = usePortalCondo();
  const { data, error, loading } = usePortalFetch<OccurrencesResponse>(
    condominiumId
      ? `/api/portal/occurrences?condominiumId=${encodeURIComponent(condominiumId)}`
      : null,
  );

  return (
    <PortalShell
      title={t("occurrences.title")}
      subtitle={t("occurrences.subtitle")}
    >
      {loading ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : !data?.occurrences.length ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("occurrences.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border-light rounded-lg border border-border-light bg-surface">
          {data.occurrences.map((occ) => (
            <li key={occ.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                  {tState(occ.status)}
                </span>
                <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {tPriority(occ.priority)}
                </span>
                <span className="text-xs text-text-secondary">
                  {tCategory(occ.category)}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-text-primary">
                {occ.title}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {occ.unit ? `${t("occurrences.unit")}: ${occ.unit}` : null}
                {occ.unit && occ.dateTime ? " · " : null}
                {occ.dateTime
                  ? `${t("occurrences.reported")}: ${occ.dateTime.slice(0, 10)}`
                  : null}
                {occ.lastUpdate
                  ? ` · ${t("occurrences.lastUpdate")}: ${occ.lastUpdate.slice(0, 10)}`
                  : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
