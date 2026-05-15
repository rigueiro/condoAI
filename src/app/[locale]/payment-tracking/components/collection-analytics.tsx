import Icon from "@/components/icon";
import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface CollectionAnalyticsProps {
  collectionData?: {
    currentMonth: {
      totalCollected: number;
      totalTarget: number;
      collectionRate: number;
    };
  };
  paymentHistory?: Array<{
    id: number;
    date: string;
    amount: number;
    paymentMethod: string;
    status: string;
    property: string;
  }>;
}

function CollectionAnalytics({
  collectionData,
  paymentHistory,
}: CollectionAnalyticsProps) {
  const t = useTranslations("paymentTracking.collectionAnalytics");
  const tStatus = useTranslations("paymentTracking.status");
  const tMethods = useTranslations("paymentTracking.paymentMethods");

  const translateMethod = (method: string) => {
    const keyMap: Record<string, string> = {
      "Bank Transfer": "bankTransfer",
      "Credit Card": "creditCard",
      Check: "check",
      Cash: "cash",
      Online: "online",
      "Online Payment": "onlinePayment",
    };
    const key = keyMap[method];
    return key ? tMethods(key as "bankTransfer") : method;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate monthly trends data (mock data for demo)
  const monthlyTrends = useMemo(() => {
    return [
      { month: "Aug", collected: 420000, target: 450000 },
      { month: "Sep", collected: 445000, target: 450000 },
      { month: "Oct", collected: 438000, target: 460000 },
      { month: "Nov", collected: 452000, target: 470000 },
      { month: "Dec", collected: 461000, target: 480000 },
      {
        month: "Jan",
        collected: collectionData?.currentMonth?.totalCollected || 462500,
        target: collectionData?.currentMonth?.totalTarget || 500000,
      },
    ];
  }, [collectionData]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methodCounts =
      paymentHistory?.reduce<Record<string, number>>((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
        return acc;
      }, {}) || {};

    const colors: Record<string, string> = {
      "Bank Transfer": "#2563EB",
      "Credit Card": "#059669",
      Check: "#D97706",
      Cash: "#DC2626",
      Online: "#7C3AED",
    };

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: translateMethod(method),
      value: count,
      color: colors[method] ?? "#6B7280",
    }));
  }, [paymentHistory, tMethods]);

  // Payment status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts =
      paymentHistory?.reduce<Record<string, number>>((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {}) || {};

    const colors: Record<string, string> = {
      completed: "#059669",
      pending: "#D97706",
      failed: "#DC2626",
      disputed: "#EA580C",
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: tStatus(status as "completed"),
      value: count,
      color: colors[status] ?? "#6B7280",
    }));
  }, [paymentHistory, tStatus]);

  // Daily collection trends (last 7 days)
  const dailyTrends = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const dayPayments =
        paymentHistory?.filter((payment) => payment.date === date) || [];
      const totalAmount = dayPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const paymentCount = dayPayments.length;

      return {
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        amount: totalAmount,
        count: paymentCount,
      };
    });
  }, [paymentHistory]);

  return (
    <div className="space-y-6">
      {/* Collection Trends */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t("collectionTrends")}
          </h3>
          <Icon name="TrendingUp" size={20} className="text-success" />
        </div>

        <div className="w-full h-64" aria-label={t("collectionTrendsAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-light)"
              />
              <XAxis
                dataKey="month"
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), ""]}
                labelStyle={{ color: "var(--color-text-primary)" }}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="collected"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--color-secondary-300)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t("dailyActivity")}
          </h3>
          <Icon name="Calendar" size={20} className="text-accent" />
        </div>

        <div className="w-full h-48" aria-label={t("dailyActivityAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-light)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
              <Tooltip
                formatter={(value, name) => [
                  name === "amount" ? formatCurrency(Number(value)) : value,
                  name === "amount" ? t("tooltipAmount") : t("tooltipPayments"),
                ]}
                labelStyle={{ color: "var(--color-text-primary)" }}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t("paymentMethods")}
          </h3>
          <Icon name="CreditCard" size={20} className="text-secondary" />
        </div>

        <div className="w-full h-48" aria-label={t("paymentMethodsAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, t("tooltipPayments")]}
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

        <div className="mt-4 space-y-2">
          {paymentMethodData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-text-primary">{item.name}</span>
              </div>
              <span className="text-text-secondary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t("paymentStatus")}
          </h3>
          <Icon name="PieChart" size={20} className="text-warning" />
        </div>

        <div className="space-y-3">
          {statusDistribution.map((item, index) => {
            const total = statusDistribution.reduce(
              (sum, s) => sum + s.value,
              0,
            );
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-text-primary">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {item.value}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("quickStats")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <div className="flex items-center space-x-2">
              <Icon name="DollarSign" size={16} className="text-success" />
              <span className="text-sm text-text-secondary">{t("avgPayment")}</span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {paymentHistory &&
                formatCurrency(
                  paymentHistory?.reduce((sum, p) => sum + p.amount, 0) /
                    (paymentHistory?.length || 1) || 0,
                )}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <div className="flex items-center space-x-2">
              <Icon name="TrendingUp" size={16} className="text-primary" />
              <span className="text-sm text-text-secondary">
                {t("highestPayment")}
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {formatCurrency(
                Math.max(...(paymentHistory?.map((p) => p.amount) || [0])),
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={16} className="text-accent" />
              <span className="text-sm text-text-secondary">{t("thisMonth")}</span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {t("paymentsCount", {
                count:
                  paymentHistory?.filter((p) => {
                    const paymentDate = new Date(p.date);
                    const currentDate = new Date();
                    return (
                      paymentDate.getMonth() === currentDate.getMonth() &&
                      paymentDate.getFullYear() === currentDate.getFullYear()
                    );
                  }).length || 0,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionAnalytics;
