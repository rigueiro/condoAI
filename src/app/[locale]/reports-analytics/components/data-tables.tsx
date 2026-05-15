// src/pages/reports-analytics/components/DataTables.jsx
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";

type PropertyPerformanceRow = {
  property: string;
  units: number;
  collected: number;
  outstanding: number;
  rate: number;
};

type CollectionTrendRow = {
  month: string;
  collected: number;
  target: number;
  rate: number;
};

type PaymentMethodRow = {
  method: string;
  count: number;
  amount: number;
  percentage: number;
};

function DataTables({
  reportData,
  onExport,
}: {
  reportData: any;
  onExport?: (format: string, table: string) => void;
}) {
  const t = useTranslations("reportsAnalytics.dataTables");
  const [activeTable, setActiveTable] = useState("property-performance");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const tableTabs = [
    {
      id: "property-performance",
      label: t("tabs.propertyPerformance"),
      icon: "Building2",
    },
    {
      id: "collection-summary",
      label: t("tabs.collectionSummary"),
      icon: "DollarSign",
    },
    { id: "payment-methods", label: t("tabs.paymentMethods"), icon: "CreditCard" },
  ] as { id: string; label: string; icon: string }[];

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortedData = <T extends Record<string, string | number>>(
    data: T[],
    key: string,
  ) => {
    if (!sortConfig.key || sortConfig.key !== key) return data;

    const sortKey = sortConfig.key;
    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  const SortButton = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 hover:text-primary transition-colors"
    >
      <span>{children}</span>
      <Icon
        name={
          sortConfig.key === column && sortConfig.direction === "desc"
            ? "ChevronDown"
            : "ChevronUp"
        }
        size={14}
        className={
          sortConfig.key === column ? "text-primary" : "text-text-secondary"
        }
      />
    </button>
  );

  const renderPropertyPerformanceTable = () => {
    const data = getSortedData<PropertyPerformanceRow>(
      reportData?.propertyPerformance || [],
      "property",
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="property">{t("columns.property")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="units">{t("columns.units")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="collected">{t("columns.collected")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="outstanding">{t("columns.outstanding")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="rate">{t("columns.collectionRate")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("columns.status")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {data.map((property: PropertyPerformanceRow, index: number) => (
              <tr
                key={index}
                className="hover:bg-secondary-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icon
                      name="Building2"
                      size={16}
                      className="text-primary mr-3"
                    />
                    <div className="text-sm font-medium text-text-primary">
                      {property.property}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {property.units}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                  {formatCurrency(property.collected)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-warning">
                  {formatCurrency(property.outstanding)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  <div className="flex items-center">
                    <div className="w-16 bg-secondary-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: `${property.rate}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">
                      {formatPercentage(property.rate)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      property.rate >= 95
                        ? "bg-success-100 text-success"
                        : property.rate >= 90
                          ? "bg-warning-100 text-warning"
                          : "bg-error-100 text-error"
                    }`}
                  >
                    {property.rate >= 95
                      ? t("status.excellent")
                      : property.rate >= 90
                        ? t("status.good")
                        : t("status.needsAttention")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCollectionSummaryTable = () => {
    const data = getSortedData<CollectionTrendRow>(
      reportData?.collectionTrends || [],
      "month",
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="month">{t("columns.period")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="target">{t("columns.target")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="collected">{t("columns.collected")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("columns.variance")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="rate">{t("columns.achievement")}</SortButton>
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {data.map((period: CollectionTrendRow, index: number) => {
              const variance = period.collected - period.target;
              const achievement = (period.collected / period.target) * 100;

              return (
                <tr
                  key={index}
                  className="hover:bg-secondary-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {period.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {formatCurrency(period.target)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                    {formatCurrency(period.collected)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={variance >= 0 ? "text-success" : "text-error"}
                    >
                      {variance >= 0 ? "+" : ""}
                      {formatCurrency(variance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-secondary-200 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full ${
                            achievement >= 100
                              ? "bg-success"
                              : achievement >= 95
                                ? "bg-warning"
                                : "bg-error"
                          }`}
                          style={{ width: `${Math.min(achievement, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPercentage(achievement)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaymentMethodsTable = () => {
    const data = getSortedData<PaymentMethodRow>(
      reportData?.paymentDistribution || [],
      "method",
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="method">{t("columns.paymentMethod")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="count">{t("columns.transactions")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="amount">{t("columns.totalAmount")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                <SortButton column="percentage">{t("columns.percentage")}</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("columns.average")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {data.map((method: PaymentMethodRow, index: number) => (
              <tr
                key={index}
                className="hover:bg-secondary-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icon
                      name="CreditCard"
                      size={16}
                      className="text-primary mr-3"
                    />
                    <div className="text-sm font-medium text-text-primary">
                      {method.method}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {method.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                  {formatCurrency(method.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-secondary-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(method.percentage)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {formatCurrency(method.amount / method.count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTable = () => {
    switch (activeTable) {
      case "property-performance":
        return renderPropertyPerformanceTable();
      case "collection-summary":
        return renderCollectionSummaryTable();
      case "payment-methods":
        return renderPaymentMethodsTable();
      default:
        return renderPropertyPerformanceTable();
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light">
      {/* Table Header */}
      <div className="p-6 border-b border-border-light">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary">{t("subtitle")}</p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.("excel", activeTable)}
            >
              <Icon name="FileSpreadsheet" size={16} className="mr-2" />
              {t("excel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.("pdf", activeTable)}
            >
              <Icon name="FileText" size={16} className="mr-2" />
              {t("pdf")}
            </Button>
          </div>
        </div>

        {/* Table Tabs */}
        <div className="flex space-x-1 bg-secondary-50 rounded-lg p-1 mt-4">
          {tableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTable(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTable === tab.id
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden">{renderTable()}</div>
    </div>
  );
}

export default DataTables;
