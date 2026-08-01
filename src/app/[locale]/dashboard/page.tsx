"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useUser } from "@/lib/auth";

import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import {
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
} from "recharts";
import RecentActivity from "./components/recent-activity";
import QuickActions from "./components/quick-actions";
import UpcomingPayments, { PaymentStatus } from "./components/upcoming-payments";
import { mockOwners, mockProperties } from "@/fixtures/views";

function Dashboard() {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useFormatCurrency();
  const user = useUser();

  // Stable reference time captured once so mock timestamps stay idempotent across renders.
  const [now] = useState(() => Date.now());

  // Mock dashboard data
  const dashboardStats = {
    totalProperties: 24,
    totalUnits: 486,
    monthlyCollectionRate: 92.5,
    outstandingPayments: 125000,
    currency: "EUR",
  };

  const collectionTrends = [
    { month: "Jan", collected: 450000, target: 500000 },
    { month: "Feb", collected: 480000, target: 500000 },
    { month: "Mar", collected: 465000, target: 500000 },
    { month: "Apr", collected: 520000, target: 500000 },
    { month: "May", collected: 495000, target: 500000 },
    { month: "Jun", collected: 510000, target: 500000 },
  ];

  const propertyDistribution = useMemo(
    () => [
      { name: t("distribution.large"), value: 12, color: "#2563EB" },
      { name: t("distribution.medium"), value: 8, color: "#0891B2" },
      { name: t("distribution.small"), value: 4, color: "#059669" },
    ],
    [t],
  );

  const recentActivities = [
    {
      id: 1,
      type: "payment",
      title: t("mockActivities.paymentReceived"),
      description: `Fração A-101 - ${mockOwners[0].property} - Quota mensal`,
      amount: mockOwners[0].monthlyQuota,
      timestamp: new Date(now - 300000),
      icon: "CreditCard",
      iconColor: "var(--color-success)",
    },
    {
      id: 2,
      type: "owner",
      title: t("mockActivities.newOwner"),
      description: `${mockOwners[1].name} - Fração ${mockOwners[1].unit} - ${mockOwners[1].property}`,
      timestamp: new Date(now - 1800000),
      icon: "UserPlus",
      iconColor: "var(--color-primary)",
    },
    {
      id: 3,
      type: "property",
      title: t("mockActivities.propertyUpdated"),
      description: `${mockProperties[1].name} - Regulamento interno atualizado`,
      timestamp: new Date(now - 3600000),
      icon: "Building2",
      iconColor: "var(--color-accent)",
    },
    {
      id: 4,
      type: "payment",
      title: t("mockActivities.paymentOverdue"),
      description: `Fração ${mockOwners[4].unit} - ${mockOwners[4].property} - Quota em atraso`,
      timestamp: new Date(now - 7200000),
      icon: "AlertTriangle",
      iconColor: "var(--color-warning)",
    },
    {
      id: 5,
      type: "maintenance",
      title: t("mockActivities.maintenanceRequest"),
      description: "Manutenção do elevador agendada - Torre do Tejo",
      timestamp: new Date(now - 10800000),
      icon: "Wrench",
      iconColor: "var(--color-secondary)",
    },
  ];

  const upcomingPayments = mockOwners.slice(0, 4).map((owner, index) => ({
    id: index + 1,
    ownerName: owner.name,
    unit: owner.unit,
    property: owner.property,
    amount: owner.monthlyQuota ?? 0,
    dueDate: new Date(now + 86400000 * (index === 2 ? -2 : (index + 1) * 3)),
    status:
      index === 2
        ? PaymentStatus.Overdue
        : index === 1
          ? PaymentStatus.Paid
          : PaymentStatus.Pending,
  }));

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary">
              {t("welcome", { name: user?.name ?? "" })}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Properties */}
            <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    {t("stats.totalProperties")}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {dashboardStats.totalProperties}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Icon
                    name="Building2"
                    size={24}
                    color="var(--color-primary)"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Icon
                  name="TrendingUp"
                  size={16}
                  color="var(--color-success)"
                />
                <span className="text-success text-sm font-medium ml-1">
                  {t("stats.addedThisMonth")}
                </span>
              </div>
            </div>

            {/* Total Units */}
            <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    {t("stats.totalUnits")}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {dashboardStats.totalUnits}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent-50 rounded-lg flex items-center justify-center">
                  <Icon name="Home" size={24} color="var(--color-accent)" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Icon
                  name="Users"
                  size={16}
                  color="var(--color-text-secondary)"
                />
                <span className="text-text-secondary text-sm ml-1">
                  {t("stats.occupancy")}
                </span>
              </div>
            </div>

            {/* Collection Rate */}
            <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    {t("stats.collectionRate")}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {formatPercentage(dashboardStats.monthlyCollectionRate)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
                  <Icon
                    name="TrendingUp"
                    size={24}
                    color="var(--color-success)"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Icon name="Target" size={16} color="var(--color-success)" />
                <span className="text-success text-sm font-medium ml-1">
                  {t("stats.aboveTarget")}
                </span>
              </div>
            </div>

            {/* Outstanding Payments */}
            <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    {t("stats.outstandingPayments")}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {formatCurrency(dashboardStats.outstandingPayments)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
                  <Icon
                    name="AlertCircle"
                    size={24}
                    color="var(--color-warning)"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Icon name="Clock" size={16} color="var(--color-warning)" />
                <span className="text-warning text-sm font-medium ml-1">
                  {t("stats.overdueCount")}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Panel - Charts and Activity */}
            <div className="lg:col-span-8 space-y-8">
              {/* Collection Trends Chart */}
              <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {t("charts.collectionTrends")}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-text-secondary">
                        {t("charts.collected")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-secondary-300 rounded-full"></div>
                      <span className="text-sm text-text-secondary">
                        {t("charts.target")}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="w-full h-80"
                  aria-label={t("charts.collectionTrendsAria")}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionTrends}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border-light)"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis stroke="var(--color-text-secondary)" />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value as number),
                          "",
                        ]}
                        labelStyle={{ color: "var(--color-text-primary)" }}
                        contentStyle={{
                          backgroundColor: "var(--color-background)",
                          border: "1px solid var(--color-border-light)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="collected"
                        fill="var(--color-primary)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="target"
                        fill="var(--color-secondary-300)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Property Distribution */}
              <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  {t("charts.propertyDistribution")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="w-full h-64"
                    aria-label={t("charts.propertyDistributionAria")}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={propertyDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {propertyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            value,
                            t("charts.propertiesTooltip"),
                          ]}
                          contentStyle={{
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border-light)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    {propertyDistribution.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-text-primary font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-text-secondary">
                          {t("charts.unitsCount", { count: item.value })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <RecentActivity activities={recentActivities} />
            </div>

            {/* Right Panel - Quick Actions and Upcoming Payments */}
            <div className="lg:col-span-4 space-y-8">
              {/* Quick Actions */}
              <QuickActions />

              {/* Upcoming Payments 
              <UpcomingPayments
                payments={upcomingPayments}
                formatCurrency={formatCurrency}
                
              />*/}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
