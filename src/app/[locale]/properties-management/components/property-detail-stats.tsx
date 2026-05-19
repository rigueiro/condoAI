"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { Property } from "../types";
import type { Owner } from "@/app/[locale]/owners-management/components/types";

interface Props {
  property: Property;
  owners: Owner[];
}

function PropertyDetailStats({ property, owners }: Props) {
  const t = useTranslations("propertiesManagement.detail");
  const { formatCurrency } = useFormatCurrency();

  const stats = useMemo(() => {
    const occupancy =
      property.totalUnits > 0
        ? (property.occupiedUnits / property.totalUnits) * 100
        : 0;
    const monthlyRevenue = property.averageFee * property.occupiedUnits;
    const target = property.totalUnits * property.averageFee;
    const collected = (target * property.collectionRate) / 100;
    const outstanding = target - collected;
    const ownersOverdue = owners.filter(
      (o) => o.paymentStatus === "overdue",
    ).length;
    const ownerOutstanding = owners.reduce(
      (sum, o) => sum + o.currentBalance,
      0,
    );

    return {
      occupancy,
      monthlyRevenue,
      outstanding,
      ownersOverdue,
      ownerOutstanding,
    };
  }, [property, owners]);

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return "text-success";
    if (rate >= 90) return "text-warning";
    return "text-error";
  };

  const getCollectionRateBg = (rate: number) => {
    if (rate >= 95) return "bg-success-50";
    if (rate >= 90) return "bg-warning-50";
    return "bg-error-50";
  };

  return (
    <section className="bg-surface rounded-lg border border-border-light p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">
        {t("statistics")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 bg-secondary-50">
          <p className="text-sm text-text-secondary mb-1">{t("occupancy")}</p>
          <p className="text-2xl font-bold text-text-primary">
            {stats.occupancy.toFixed(1)}%
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {property.occupiedUnits}/{property.totalUnits} {t("unitsLabel")}
          </p>
        </div>
        <div
          className={`rounded-lg p-4 ${getCollectionRateBg(property.collectionRate)}`}
        >
          <p className="text-sm text-text-secondary mb-1">
            {t("collectionRateLabel")}
          </p>
          <p
            className={`text-2xl font-bold ${getCollectionRateColor(property.collectionRate)}`}
          >
            {property.collectionRate}%
          </p>
        </div>
        <div className="rounded-lg p-4 bg-success-50">
          <p className="text-sm text-text-secondary mb-1">{t("monthlyRevenue")}</p>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(stats.monthlyRevenue)}
          </p>
        </div>
        <div className="rounded-lg p-4 bg-warning-50">
          <p className="text-sm text-text-secondary mb-1">
            {t("outstandingBalance")}
          </p>
          <p className="text-2xl font-bold text-warning">
            {formatCurrency(stats.outstanding)}
          </p>
        </div>
        <div className="rounded-lg p-4 bg-secondary-50">
          <p className="text-sm text-text-secondary mb-1">{t("totalOwners")}</p>
          <p className="text-2xl font-bold text-text-primary">{owners.length}</p>
          {stats.ownersOverdue > 0 && (
            <p className="text-xs text-error mt-1">
              {t("ownersOverdue", { count: stats.ownersOverdue })}
            </p>
          )}
        </div>
        <div
          className={`rounded-lg p-4 ${stats.ownerOutstanding > 0 ? "bg-error-50" : "bg-success-50"}`}
        >
          <p className="text-sm text-text-secondary mb-1">{t("ownerBalances")}</p>
          <p
            className={`text-2xl font-bold ${stats.ownerOutstanding > 0 ? "text-error" : "text-success"}`}
          >
            {formatCurrency(stats.ownerOutstanding)}
          </p>
        </div>
      </div>
    </section>
  );
}


export default PropertyDetailStats;
