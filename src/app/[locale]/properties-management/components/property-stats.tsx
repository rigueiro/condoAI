import Icon from "@/components/icon";
import React from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { Property } from "../types";

type StatCardProps = {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "accent" | "success" | "warning" | "error";
};

interface PropertyStatsProps {
  properties: Property[];
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color = "primary",
}: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border-light p-4">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center`}
        >
          <Icon name={icon} size={20} color={`var(--color-${color})`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-lg font-semibold text-text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyStats({ properties }: PropertyStatsProps) {
  const t = useTranslations("propertiesManagement.stats");
  const { formatCurrency } = useFormatCurrency();
  const stats = React.useMemo(() => {
    const totalProperties = properties.length;
    const totalUnits = properties.reduce(
      (sum, prop) => sum + prop.totalUnits,
      0,
    );
    const totalOccupied = properties.reduce(
      (sum, prop) => sum + prop.occupiedUnits,
      0,
    );
    const averageOccupancy =
      totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;
    const averageCollectionRate =
      properties.length > 0
        ? properties.reduce((sum, prop) => sum + prop.collectionRate, 0) /
          properties.length
        : 0;
    const totalRevenue = properties.reduce(
      (sum, prop) => sum + prop.averageFee * prop.occupiedUnits,
      0,
    );

    // Collection rate categories
    const excellentCollection = properties.filter(
      (p) => p.collectionRate >= 95,
    ).length;
    const goodCollection = properties.filter(
      (p) => p.collectionRate >= 90 && p.collectionRate < 95,
    ).length;
    const needsAttention = properties.filter(
      (p) => p.collectionRate < 90,
    ).length;

    // Building types
    const buildingTypes = properties.reduce<Record<string, number>>(
      (acc, prop) => {
        acc[prop.buildingType] = (acc[prop.buildingType] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      totalProperties,
      totalUnits,
      totalOccupied,
      averageOccupancy,
      averageCollectionRate,
      totalRevenue,
      excellentCollection,
      goodCollection,
      needsAttention,
      buildingTypes,
    };
  }, [properties]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t('overview')}
        </h3>
        <div className="space-y-4">
          <StatCard
            icon="Building2"
            title={t("properties")}
            value={stats.totalProperties}
            subtitle={t("activeProperties")}
          />

          <StatCard
            icon="Home"
            title={t("units")}
            value={stats.totalUnits.toLocaleString()}
            subtitle={t("occupied", { count: stats.totalOccupied })}
          />

          <StatCard
            icon="Users"
            title={t("occupancy")}
            value={`${stats.averageOccupancy.toFixed(1)}%`}
            subtitle={t("portfolioWide")}
            color="accent"
          />

          <StatCard
            icon="DollarSign"
            title={t("monthlyRevenue")}
            value={formatCurrency(stats.totalRevenue)}
            subtitle={t("fromOccupied")}
            color="success"
          />
        </div>
      </div>

      {/* Collection Performance */}
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t('collections')}
        </h3>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              {t('averageRate')}
            </span>
            <span className="text-lg font-semibold text-text-primary">
              {stats.averageCollectionRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-secondary-100 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.averageCollectionRate}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full" />
              <span className="text-sm text-text-secondary">
                {t('excellent')}
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {stats.excellentCollection}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning rounded-full" />
              <span className="text-sm text-text-secondary">{t('good')}</span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {stats.goodCollection}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-error rounded-full" />
              <span className="text-sm text-text-secondary">
                {t('needsAttention')}
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {stats.needsAttention}
            </span>
          </div>
        </div>
      </div>

      {/* Building Types */}
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t('buildingTypes')}
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.buildingTypes).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{type}</span>
              <span className="text-sm font-medium text-text-primary">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t('quickActions')}
        </h3>
        <div className="space-y-3">
          <button className="w-full flex items-center space-x-3 p-3 text-left text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="FileText" size={16} />
            <span className="text-sm">{t('generateReport')}</span>
          </button>

          <button className="w-full flex items-center space-x-3 p-3 text-left text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="Download" size={16} />
            <span className="text-sm">{t('exportData')}</span>
          </button>

          <button className="w-full flex items-center space-x-3 p-3 text-left text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="Settings" size={16} />
            <span className="text-sm">{t('bulkSettings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyStats;
