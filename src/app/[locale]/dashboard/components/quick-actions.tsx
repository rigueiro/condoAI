"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";

function QuickActions() {
  const t = useTranslations("dashboard.quickActions");

  const quickActions = [
    {
      title: t("addProperty"),
      description: t("addPropertyDesc"),
      icon: "Building2",
      iconColor: "var(--color-primary)",
      bgColor: "bg-primary-50",
      link: "/properties-management",
    },
    {
      title: t("addOwner"),
      description: t("addOwnerDesc"),
      icon: "UserPlus",
      iconColor: "var(--color-accent)",
      bgColor: "bg-accent-50",
      link: "/owners-management",
    },
    {
      title: t("addPayment"),
      description: t("addPaymentDesc"),
      icon: "CreditCard",
      iconColor: "var(--color-success)",
      bgColor: "bg-success-50",
      link: "/payment-tracking",
    },
    {
      title: t("generateReport"),
      description: t("generateReportDesc"),
      icon: "FileText",
      iconColor: "var(--color-warning)",
      bgColor: "bg-warning-50",
      link: "/reports-analytics",
    },
  ];

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        {t("title")}
      </h2>

      <div className="space-y-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.link}
            className="block p-4 rounded-lg border border-border-light hover:border-primary-200 hover:bg-primary-50 transition-smooth group"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-smooth`}
              >
                <Icon name={action.icon} size={24} color={action.iconColor} />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-primary transition-smooth">
                  {action.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {action.description}
                </p>
              </div>

              <Icon
                name="ChevronRight"
                size={16}
                color="var(--color-text-secondary)"
                className="group-hover:text-primary transition-smooth"
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-light">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/properties-management"
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium"
          >
            <Icon name="Plus" size={16} />
            <span>{t("addProperty")}</span>
          </Link>

          <Link
            href="/owners-management"
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-100 text-text-primary rounded-lg hover:bg-secondary-200 transition-smooth text-sm font-medium"
          >
            <Icon name="Users" size={16} />
            <span>{t("manageOwners")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default QuickActions;
