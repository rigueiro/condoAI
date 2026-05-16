"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import { Owner } from "./types";

function OwnerStatistics({ owners }: { owners: Owner[] }) {
  const t = useTranslations("ownersManagement.stats");
  const tStatus = useTranslations("ownersManagement.status");
  const { formatCurrency } = useFormatCurrency();

  const totalOwners = owners.length;
  const unitsOccupied = owners.length;
  const currentPayments = owners.filter(
    (owner) => owner.paymentStatus === "current",
  ).length;
  const overduePayments = owners.filter(
    (owner) => owner.paymentStatus === "overdue",
  ).length;
  const pendingPayments = owners.filter(
    (owner) => owner.paymentStatus === "pending",
  ).length;

  const complianceRate =
    totalOwners > 0 ? Math.round((currentPayments / totalOwners) * 100) : 0;
  const totalOutstanding = owners.reduce(
    (sum, owner) => sum + owner.currentBalance,
    0,
  );

  const stats = [
    {
      label: t("totalOwners"),
      value: totalOwners,
      icon: "Users",
      color: "text-primary",
      bgColor: "bg-primary-50",
    },
    {
      label: t("unitsOccupied"),
      value: unitsOccupied,
      icon: "Building2",
      color: "text-accent",
      bgColor: "bg-accent-50",
    },
    {
      label: t("paymentCompliance"),
      value: `${complianceRate}%`,
      icon: "TrendingUp",
      color: "text-success",
      bgColor: "bg-success-50",
    },
    {
      label: t("outstandingBalance"),
      value: formatCurrency(totalOutstanding),
      icon: "DollarSign",
      color: "text-warning",
      bgColor: "bg-warning-50",
    },
  ];

  const paymentStatusStats = [
    {
      label: tStatus("current"),
      count: currentPayments,
      color: "text-success",
      bgColor: "bg-success-100",
    },
    {
      label: tStatus("pending"),
      count: pendingPayments,
      color: "text-warning",
      bgColor: "bg-warning-100",
    },
    {
      label: tStatus("overdue"),
      count: overduePayments,
      color: "text-error",
      bgColor: "bg-error-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("title")}
        </h3>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <Icon name={stat.icon} size={20} className={stat.color} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
                <div className="text-lg font-semibold text-text-primary">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("paymentStatus")}
        </h3>
        <div className="space-y-3">
          {paymentStatusStats.map((status, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status.bgColor}`} />
                <span className="text-sm text-text-secondary">
                  {status.label}
                </span>
              </div>
              <span className={`text-sm font-medium ${status.color}`}>
                {status.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("quickActions")}
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="Mail" size={16} className="inline mr-2" />
            {t("sendReminders")}
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="Download" size={16} className="inline mr-2" />
            {t("exportList")}
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="FileText" size={16} className="inline mr-2" />
            {t("generateReports")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerStatistics;
