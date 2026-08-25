"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { roleDisplayKey } from "@/lib/memberships";
import PortalShell from "./components/portal-shell";
import { usePortalCondo } from "./components/use-portal-condo";

export default function PortalHomePage() {
  const t = useTranslations("portal");
  const tRoles = useTranslations("portal.roles");
  const { selected } = usePortalCondo();

  return (
    <PortalShell title={t("home.title")} subtitle={t("home.subtitle")}>
      {selected && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/portal/extract?condo=${selected.condominiumId}`}
            className="rounded-lg border border-border-light bg-surface p-6 transition-smooth hover:border-primary-100"
          >
            <h2 className="text-base font-semibold text-text-primary">
              {t("home.extractCard")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {selected.ownerId
                ? t("home.extractHint", { name: selected.ownerName ?? "" })
                : t("home.extractUnavailable")}
            </p>
          </Link>
          <Link
            href={`/portal/documents?condo=${selected.condominiumId}`}
            className="rounded-lg border border-border-light bg-surface p-6 transition-smooth hover:border-primary-100"
          >
            <h2 className="text-base font-semibold text-text-primary">
              {t("home.documentsCard")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {t("home.documentsHint")}
            </p>
          </Link>
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
