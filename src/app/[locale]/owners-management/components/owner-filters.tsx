"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { PaymentStatus } from "./types";

interface Props {
  filters: {
    search: string;
    property: string;
    paymentStatus: PaymentStatus;
    balanceRange: string;
  };
  onFiltersChange: React.Dispatch<
    React.SetStateAction<{
      search: string;
      property: string;
      paymentStatus: PaymentStatus;
      balanceRange: string;
    }>
  >;
  properties: { id: string; name: string }[];
}

function OwnerFilters({ filters, onFiltersChange, properties }: Props) {
  const t = useTranslations("ownersManagement.filters");
  const tStatus = useTranslations("ownersManagement.status");

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      property: "",
      paymentStatus: "",
      balanceRange: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const balanceLabels: Record<string, string> = {
    zero: t("balanceZero"),
    low: t("balanceLow"),
    medium: t("balanceMedium"),
    high: t("balanceHigh"),
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2 lg:mb-0">
          {t("title")}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-accent hover:text-accent-700 transition-smooth"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Icon
            name="Search"
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
          />
        </div>

        <div className="relative">
          <select
            value={filters.property}
            onChange={(e) => handleFilterChange("property", e.target.value)}
            className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth appearance-none bg-surface"
          >
            <option value="">{t("allProperties")}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.name}>
                {property.name}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={20}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              handleFilterChange("paymentStatus", e.target.value)
            }
            className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth appearance-none bg-surface"
          >
            <option value="">{t("allPaymentStatus")}</option>
            <option value="current">{tStatus("current")}</option>
            <option value="pending">{tStatus("pending")}</option>
            <option value="overdue">{tStatus("overdue")}</option>
          </select>
          <Icon
            name="ChevronDown"
            size={20}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            value={filters.balanceRange}
            onChange={(e) => handleFilterChange("balanceRange", e.target.value)}
            className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth appearance-none bg-surface"
          >
            <option value="">{t("allBalances")}</option>
            <option value="zero">{t("balanceZero")}</option>
            <option value="low">{t("balanceLow")}</option>
            <option value="medium">{t("balanceMedium")}</option>
            <option value="high">{t("balanceHigh")}</option>
          </select>
          <Icon
            name="ChevronDown"
            size={20}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center space-x-1 bg-primary-50 text-primary px-3 py-1 rounded-full text-sm">
              <span>
                {t("chipSearch")} {filters.search}
              </span>
              <button
                onClick={() => handleFilterChange("search", "")}
                className="hover:bg-primary-100 rounded-full p-0.5 transition-smooth"
              >
                <Icon name="X" size={14} />
              </button>
            </span>
          )}
          {filters.property && (
            <span className="inline-flex items-center space-x-1 bg-accent-50 text-accent px-3 py-1 rounded-full text-sm">
              <span>
                {t("chipProperty")} {filters.property}
              </span>
              <button
                onClick={() => handleFilterChange("property", "")}
                className="hover:bg-accent-100 rounded-full p-0.5 transition-smooth"
              >
                <Icon name="X" size={14} />
              </button>
            </span>
          )}
          {filters.paymentStatus && (
            <span className="inline-flex items-center space-x-1 bg-warning-50 text-warning px-3 py-1 rounded-full text-sm">
              <span>
                {t("chipStatus")}{" "}
                {tStatus(filters.paymentStatus as "current" | "pending" | "overdue")}
              </span>
              <button
                onClick={() => handleFilterChange("paymentStatus", "")}
                className="hover:bg-warning-100 rounded-full p-0.5 transition-smooth"
              >
                <Icon name="X" size={14} />
              </button>
            </span>
          )}
          {filters.balanceRange && (
            <span className="inline-flex items-center space-x-1 bg-success-50 text-success px-3 py-1 rounded-full text-sm">
              <span>
                {t("chipBalance")}{" "}
                {balanceLabels[filters.balanceRange] ?? filters.balanceRange}
              </span>
              <button
                onClick={() => handleFilterChange("balanceRange", "")}
                className="hover:bg-success-100 rounded-full p-0.5 transition-smooth"
              >
                <Icon name="X" size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerFilters;
