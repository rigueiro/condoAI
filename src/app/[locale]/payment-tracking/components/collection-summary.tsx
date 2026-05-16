import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { useFormatCurrency } from "@/hooks/use-format-currency";

type CollectionData = {
  currentMonth: {
    totalTarget: number;
    totalCollected: number;
    collectionRate: number;
    outstandingBalance: number;
    totalProperties: number;
  };
  propertyBreakdown: Array<{
    id: string | number;
    name: string;
    unitsCount: number;
    collected: number;
    target: number;
    collectionRate: number;
    outstanding: number;
  }>;
};

function CollectionSummary({
  collectionData,
}: {
  collectionData: CollectionData;
}) {
  const t = useTranslations("paymentTracking.collectionSummary");
  const { formatCurrency } = useFormatCurrency();

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return "text-success";
    if (rate >= 90) return "text-warning";
    return "text-error";
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 95) return "bg-success";
    if (rate >= 90) return "bg-warning";
    return "bg-error";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">
                {t("totalCollected")}
              </p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(
                  collectionData?.currentMonth?.totalCollected || 0,
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" size={24} color="var(--color-success)" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Icon name="Target" size={16} color="var(--color-success)" />
            <span className="text-success text-sm font-medium ml-1">
              {formatPercentage(
                collectionData?.currentMonth?.collectionRate || 0,
              )}{" "}
              {t("ofTarget")}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">
                {t("collectionRate")}
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${getCollectionRateColor(collectionData?.currentMonth?.collectionRate || 0)}`}
              >
                {formatPercentage(
                  collectionData?.currentMonth?.collectionRate || 0,
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <Icon name="BarChart3" size={24} color="var(--color-primary)" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Icon name="Users" size={16} color="var(--color-text-secondary)" />
            <span className="text-text-secondary text-sm ml-1">
              {t("properties", {
                count: collectionData?.currentMonth?.totalProperties || 0,
              })}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">
                {t("outstanding")}
              </p>
              <p className="text-2xl font-bold text-error mt-1">
                {formatCurrency(
                  collectionData?.currentMonth?.outstandingBalance || 0,
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-error-50 rounded-lg flex items-center justify-center">
              <Icon name="AlertCircle" size={24} color="var(--color-error)" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Icon name="Clock" size={16} color="var(--color-warning)" />
            <span className="text-warning text-sm font-medium ml-1">
              {t("requiresAttention")}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">
                {t("monthlyTarget")}
              </p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(collectionData?.currentMonth?.totalTarget || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center">
              <Icon name="Target" size={24} color="var(--color-accent)" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Icon
              name="Calendar"
              size={16}
              color="var(--color-text-secondary)"
            />
            <span className="text-text-secondary text-sm ml-1">
              {t("currentMonth")}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("progressTitle")}
          </h2>
          <div className="text-sm text-text-secondary">
            {t("progressSubtitle")}
          </div>
        </div>

        <div className="space-y-4">
          {collectionData?.propertyBreakdown?.map((property) => (
            <div
              key={property.id}
              className="border border-border-light rounded-lg p-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-text-primary">
                      {property.name}
                    </h3>
                    <span
                      className={`text-sm mr-4 font-medium ${getCollectionRateColor(property.collectionRate)}`}
                    >
                      {formatPercentage(property.collectionRate)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    {t("units", { count: property.unitsCount })}
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="text-text-secondary">{t("collected")}</p>
                    <p className="font-semibold text-success">
                      {formatCurrency(property.collected)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-text-secondary">{t("target")}</p>
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(property.target)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-text-secondary">{t("outstanding")}</p>
                    <p className="font-semibold text-error">
                      {formatCurrency(property.outstanding)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-secondary-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(property.collectionRate)}`}
                  style={{
                    width: `${Math.min(property.collectionRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CollectionSummary;
