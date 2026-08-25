"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { Link, useRouter } from "@/i18n/navigation";

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
import OverdueCollections from "./components/overdue-collections";
import { useCollections } from "@/lib/collections";

function Dashboard() {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useFormatCurrency();
  const user = useUser();
  const router = useRouter();
  const {
    isDemo,
    portfolio,
    isReady,
    needsOnboarding: mustOnboard,
  } = usePortfolio();
  const condominiums = portfolio.condominiums;
  const { overdueItems, ownersWithBalances } = useCollections();

  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (isReady && mustOnboard) {
      router.replace("/onboarding");
    }
  }, [isReady, mustOnboard, router]);

  const overdueTotal = useMemo(
    () => overdueItems.reduce((sum, item) => sum + item.amount, 0),
    [overdueItems],
  );
  const displayOwners = ownersWithBalances;
  const overdueHint =
    overdueItems.length > 0
      ? t("stats.overdueCount", { count: overdueItems.length })
      : t("stats.noOutstanding");

  const dashboardStats = useMemo(() => {
    if (isDemo) {
      return {
        totalProperties: 24,
        totalUnits: 486,
        monthlyCollectionRate: 92.5,
        outstandingPayments: overdueTotal,
        occupancyLabel: t("stats.occupancy"),
        addedLabel: t("stats.addedThisMonth"),
        collectionHint: t("stats.aboveTarget"),
        overdueHint,
      };
    }

    const totalProperties = condominiums.length;
    const totalUnits = condominiums.reduce(
      (sum, c) => sum + c.numberOfUnits,
      0,
    );
    const occupied = displayOwners.length;
    const occupancy =
      totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;

    return {
      totalProperties,
      totalUnits,
      monthlyCollectionRate: 0,
      outstandingPayments: overdueTotal,
      occupancyLabel: t("stats.occupancyDynamic", { rate: occupancy }),
      addedLabel: t("stats.portfolioReady"),
      collectionHint: t("stats.noPaymentsYet"),
      overdueHint,
    };
  }, [isDemo, condominiums, displayOwners, overdueTotal, overdueHint, t]);
  const collectionTrends = useMemo(() => {
    if (isDemo) {
      return [
        { month: "Jan", collected: 450000, target: 500000 },
        { month: "Feb", collected: 480000, target: 500000 },
        { month: "Mar", collected: 465000, target: 500000 },
        { month: "Apr", collected: 520000, target: 500000 },
        { month: "May", collected: 495000, target: 500000 },
        { month: "Jun", collected: 510000, target: 500000 },
      ];
    }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const target = displayOwners.reduce((s, o) => s + o.owner.monthlyQuota, 0);
    return months.map((month) => ({
      month,
      collected: 0,
      target,
    }));
  }, [isDemo, displayOwners]);

  const propertyDistribution = useMemo(() => {
    if (isDemo) {
      return [
        { name: t("distribution.large"), value: 12, color: "#2563EB" },
        { name: t("distribution.medium"), value: 8, color: "#0891B2" },
        { name: t("distribution.small"), value: 4, color: "#059669" },
      ];
    }
    const buckets = { large: 0, medium: 0, small: 0 };
    for (const c of condominiums) {
      if (c.numberOfUnits > 60) buckets.large += 1;
      else if (c.numberOfUnits > 30) buckets.medium += 1;
      else buckets.small += 1;
    }
    return [
      { name: t("distribution.large"), value: buckets.large, color: "#2563EB" },
      {
        name: t("distribution.medium"),
        value: buckets.medium,
        color: "#0891B2",
      },
      { name: t("distribution.small"), value: buckets.small, color: "#059669" },
    ];
  }, [isDemo, condominiums, t]);

  const recentActivities = useMemo(() => {
    if (isDemo) {
      return [
        {
          id: 1,
          type: "payment",
          title: t("mockActivities.paymentReceived"),
          description: `Fração A-101 - ${displayOwners[0]?.condominiumName ?? ""} - Quota mensal`,
          amount: displayOwners[0]?.owner.monthlyQuota,
          timestamp: new Date(now - 300000),
          icon: "CreditCard",
          iconColor: "var(--color-success)",
        },
        {
          id: 2,
          type: "owner",
          title: t("mockActivities.newOwner"),
          description: `${displayOwners[1]?.owner.fullName ?? ""} - Fração ${displayOwners[1]?.unitLabel ?? ""} - ${displayOwners[1]?.condominiumName ?? ""}`,
          timestamp: new Date(now - 1800000),
          icon: "UserPlus",
          iconColor: "var(--color-primary)",
        },
        {
          id: 3,
          type: "property",
          title: t("mockActivities.propertyUpdated"),
          description: `${condominiums[1]?.name ?? ""} - Regulamento interno atualizado`,
          timestamp: new Date(now - 3600000),
          icon: "Building2",
          iconColor: "var(--color-accent)",
        },
        {
          id: 4,
          type: "payment",
          title: t("mockActivities.paymentOverdue"),
          description: `Fração ${displayOwners[4]?.unitLabel ?? ""} - ${displayOwners[4]?.condominiumName ?? ""} - Quota em atraso`,
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
    }

    const activities = [];
    const orgName = portfolio.organization?.name;
    if (orgName) {
      activities.push({
        id: 1,
        type: "org",
        title: t("portfolioActivities.orgCreated"),
        description: orgName,
        timestamp: new Date(now - 600000),
        icon: "Building",
        iconColor: "var(--color-primary)",
      });
    }
    const condo = portfolio.condominiums[0];
    if (condo) {
      activities.push({
        id: 2,
        type: "property",
        title: t("portfolioActivities.condoAdded"),
        description: condo.name,
        timestamp: new Date(now - 300000),
        icon: "Building2",
        iconColor: "var(--color-accent)",
      });
    }
    if (displayOwners.length > 0) {
      activities.push({
        id: 3,
        type: "owner",
        title: t("portfolioActivities.ownersImported"),
        description: t("portfolioActivities.ownersImportedDesc", {
          count: displayOwners.length,
        }),
        timestamp: new Date(now - 60000),
        icon: "UserPlus",
        iconColor: "var(--color-success)",
      });
    }
    return activities;
  }, [isDemo, portfolio, displayOwners, condominiums, now, t]);

  const showEmptyCta = !isDemo && displayOwners.length === 0;

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary">
              {t("welcome", { name: user?.name ?? "" })}
            </p>
          </div>

          {showEmptyCta && (
            <div className="mb-8 bg-primary-50 border border-primary-100 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-text-primary">
                  {t("emptyImport.title")}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {t("emptyImport.body")}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/properties-management"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-medium text-sm font-medium hover:bg-surface transition-smooth"
                >
                  {t("emptyImport.properties")}
                </Link>
                <Link
                  href="/owners-management"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-smooth"
                >
                  {t("emptyImport.owners")}
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {dashboardStats.addedLabel}
                </span>
              </div>
            </div>

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
                  {dashboardStats.occupancyLabel}
                </span>
              </div>
            </div>

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
                  {dashboardStats.collectionHint}
                </span>
              </div>
            </div>

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
                  {dashboardStats.overdueHint}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
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
                          data={propertyDistribution.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {propertyDistribution
                            .filter((d) => d.value > 0)
                            .map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
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

              <RecentActivity activities={recentActivities} />
            </div>

            <div className="lg:col-span-4 space-y-8">
              <OverdueCollections formatCurrency={formatCurrency} />
              <QuickActions />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
