"use client";

import { useTranslations } from "next-intl";
import CurrentAccountExtract from "@/app/[locale]/owners-management/components/current-account-extract";
import type { LedgerMovement } from "@/lib/collections";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";

type ExtractResponse = {
  movements: LedgerMovement[];
  ownerName: string;
  unitLabel: string;
  condominiumName: string;
};

export default function PortalExtractPage() {
  const t = useTranslations("portal");
  const { condominiumId } = usePortalCondo();
  const { data, error, loading } = usePortalFetch<ExtractResponse>(
    condominiumId
      ? `/api/portal/extract?condominiumId=${encodeURIComponent(condominiumId)}`
      : null,
  );

  return (
    <PortalShell title={t("extract.title")} subtitle={t("extract.subtitle")}>
      {loading ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error === "extractUnavailable" || error === "forbidden" ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("extract.unavailable")}
        </p>
      ) : error ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : data ? (
        <CurrentAccountExtract
          movements={data.movements}
          ownerName={data.ownerName}
          unitLabel={data.unitLabel}
          condominiumName={data.condominiumName}
        />
      ) : null}
    </PortalShell>
  );
}
