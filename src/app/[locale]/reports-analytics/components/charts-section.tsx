import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";

interface ChartsSectionProps {
  reportData: {
    collectionTrends: {
      month: string;
      collected: number;
      target: number;
      rate: number;
    }[];
    propertyPerformance: {
      property: string;
      collected: number;
      outstanding: number;
      rate: number;
    }[];
    paymentDistribution: { method: string; count: number; amount: number }[];
  } | null;
  filters: {
    dateRange: { start: Date; end: Date } | null;
    selectedProperties: string[];
    reportType: string;
  };
}

function ChartsSection({ reportData, filters }: ChartsSectionProps) {
  const t = useTranslations("reportsAnalytics.chartsSection");
  const [activeChart, setActiveChart] = useState("collection-trends");

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

  const chartTabs = [
    { id: "collection-trends", label: t("tabs.collectionTrends"), icon: "TrendingUp" },
    {
      id: "property-performance",
      label: t("tabs.propertyPerformance"),
      icon: "Building2",
    },
    {
      id: "payment-distribution",
      label: t("tabs.paymentDistribution"),
      icon: "PieChart",
    },
  ] as { id: string; label: string; icon: string }[];

  const paymentMethodColors = {
    "Bank Transfer": "#2563EB",
    "Online Portal": "#059669",
    Check: "#D97706",
    Cash: "#DC2626",
  } as { [key: string]: string };

  const renderCollectionTrends = () => (
    <div className="w-full h-80" aria-label="Collection Trends Chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={reportData?.collectionTrends || []}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-light)"
          />
          <XAxis
            dataKey="month"
            stroke="var(--color-text-secondary)"
            fontSize={12}
          />
          <YAxis
            yAxisId="amount"
            orientation="left"
            stroke="var(--color-text-secondary)"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            stroke="var(--color-text-secondary)"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "rate")
                return [formatPercentage(value), "Collection Rate"];
              return [
                formatCurrency(value),
                name === "collected" ? "Collected" : "Target",
              ];
            }}
            labelStyle={{ color: "var(--color-text-primary)" }}
            contentStyle={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border-light)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            yAxisId="amount"
            dataKey="collected"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="amount"
            dataKey="target"
            fill="var(--color-secondary-300)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="rate"
            stroke="var(--color-success)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--color-success)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPropertyPerformance = () => (
    <div className="w-full h-80" aria-label="Property Performance Chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={reportData?.propertyPerformance || []}
          layout="horizontal"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-light)"
          />
          <XAxis
            type="number"
            stroke="var(--color-text-secondary)"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="property"
            stroke="var(--color-text-secondary)"
            fontSize={12}
            width={120}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "rate")
                return [formatPercentage(value), "Collection Rate"];
              return [
                formatCurrency(value),
                name === "collected" ? "Collected" : "Outstanding",
              ];
            }}
            labelStyle={{ color: "var(--color-text-primary)" }}
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-light)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="collected"
            fill="var(--color-primary)"
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="outstanding"
            fill="var(--color-warning)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPaymentDistribution = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="w-full h-64" aria-label="Payment Distribution Pie Chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                reportData?.paymentDistribution?.map((item) => ({
                  ...item,
                  fill: paymentMethodColors[item.method] || "#6B7280",
                })) || []
              }
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={5}
              dataKey="count"
            >
              {(reportData?.paymentDistribution || []).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={paymentMethodColors[entry.method] || "#6B7280"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, "Payments"]}
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-text-primary">
          {t("methodBreakdown")}
        </h4>
        {(reportData?.paymentDistribution || []).map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-border-light last:border-b-0"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    paymentMethodColors[item.method] || "#6B7280",
                }}
              ></div>
              <span className="text-sm text-text-primary">{item.method}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">
                {t("paymentsCount", { count: item.count })}
              </div>
              <div className="text-xs text-text-secondary">
                {formatCurrency(item.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChart = () => {
    switch (activeChart) {
      case "collection-trends":
        return renderCollectionTrends();
      case "property-performance":
        return renderPropertyPerformance();
      case "payment-distribution":
        return renderPaymentDistribution();
      default:
        return renderCollectionTrends();
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light">
      {/* Chart Header with Tabs */}
      <div className="p-6 border-b border-border-light">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary">
              {t("subtitle")}
            </p>
          </div>

          {/* Chart Tabs */}
          <div className="flex space-x-1 bg-secondary-50 rounded-lg p-1">
            {chartTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeChart === tab.id
                    ? "bg-surface text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name={tab.icon} size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">{renderChart()}</div>

      {/* Chart Actions */}
      <div className="px-6 py-4 border-t border-border-light bg-secondary-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-text-secondary">
            <div className="flex items-center space-x-2">
              <Icon name="Info" size={14} />
              <span>{t("dataUpdated")}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Icon name="Download" size={16} />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Icon name="Maximize2" size={16} />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Icon name="MoreHorizontal" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartsSection;
