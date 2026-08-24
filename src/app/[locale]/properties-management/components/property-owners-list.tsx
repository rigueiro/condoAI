"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Image from "@/components/image";
import type {
  OwnerOccupancyView,
  OwnerRow,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import type { OccupancyRole } from "@/types";

function occupancyLabels(
  occupancies: OwnerOccupancyView[],
  fallback: string,
  roleLabel: (role: OccupancyRole) => string,
  condominiumId?: string,
): string {
  const items = condominiumId
    ? occupancies.filter((item) => item.condominiumId === condominiumId)
    : occupancies;
  if (items.length === 0) return fallback;
  return items
    .map((item) =>
      item.role === "owner"
        ? item.unitLabel
        : `${item.unitLabel} (${roleLabel(item.role)})`,
    )
    .join(", ");
}

interface Props {
  owners: OwnerRow[];
  condominiumId?: string;
}

function PropertyOwnersList({ owners, condominiumId }: Props) {
  const t = useTranslations("propertiesManagement.detail");
  const tStatus = useTranslations("ownersManagement.status");
  const tRole = useTranslations("ownersManagement.roles");
  const { formatCurrency } = useFormatCurrency();

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      current: { color: "text-success", bg: "bg-success-100" },
      pending: { color: "text-warning", bg: "bg-warning-100" },
      overdue: { color: "text-error", bg: "bg-error-100" },
    } as Record<PaymentStatus, { color: string; bg: string }>;

    const config = statusConfig[status] || statusConfig.current;
    const label = status
      ? tStatus(status as "current" | "pending" | "overdue")
      : tStatus("current");

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        {label}
      </span>
    );
  };

  if (owners.length === 0) {
    return (
      <section className="bg-surface rounded-lg border border-border-light overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="text-lg font-semibold text-text-primary">{t("owners")}</h2>
        </div>
        <div className="p-8 text-center text-text-secondary">
          <Icon name="Users" size={40} className="mx-auto mb-2 text-secondary-300" />
          <p>{t("noOwners")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface rounded-lg border border-border-light overflow-hidden">
      <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{t("owners")}</h2>
        <span className="text-sm text-text-secondary">
          {t("ownerCount", { count: owners.length })}
        </span>
      </div>
      <ul className="divide-y divide-border-light">
        {owners.map((row) => (
          <li
            key={row.owner.id}
            className="px-6 py-4 hover:bg-secondary-50 transition-smooth"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary-100 shrink-0">
                  <Image
                    src={row.avatar || ""}
                    alt={row.owner.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/owners-management/${row.owner.id}`}
                    className="font-medium text-text-primary hover:text-primary transition-smooth truncate block"
                  >
                    {row.owner.fullName}
                  </Link>
                  <p className="text-sm text-text-secondary truncate">
                    {t("ownerUnit", {
                      unit: occupancyLabels(
                        row.occupancies,
                        row.unitLabel,
                        tRole,
                        condominiumId,
                      ),
                    })}{" "}
                    • {row.owner.contacts.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-text-secondary">{t("balance")}</p>
                  <p
                    className={`text-sm font-medium ${row.currentBalance > 0 ? "text-error" : "text-success"}`}
                  >
                    {formatCurrency(row.currentBalance)}
                  </p>
                </div>
                {getPaymentStatusBadge(row.paymentStatus)}
                <Link
                  href={`/owners-management/${row.owner.id}`}
                  className="p-1 text-text-secondary hover:text-primary transition-smooth"
                  title={t("viewOwner")}
                >
                  <Icon name="ChevronRight" size={18} />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PropertyOwnersList;
