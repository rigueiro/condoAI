import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";

interface PaymentFiltersProps {
  filters: {
    dateRange: { start: string; end: string };
    property: string;
    status: string;
    amountRange: { min: string; max: string };
    searchTerm: string;
  };
  onFiltersChange: (newFilters: any) => void;
  paymentHistory: Array<{
    property: string;
    [key: string]: any;
  }>;
}

function PaymentFilters({
  filters,
  onFiltersChange,
  paymentHistory,
}: PaymentFiltersProps) {
  const t = useTranslations("paymentTracking.paymentFilters");
  const tStatus = useTranslations("paymentTracking.status");
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const newDateRange = { ...localFilters.dateRange, [field]: value };
    const newFilters = { ...localFilters, dateRange: newDateRange };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAmountRangeChange = (field: "min" | "max", value: string) => {
    const newAmountRange = { ...localFilters.amountRange, [field]: value };
    const newFilters = { ...localFilters, amountRange: newAmountRange };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: { start: "", end: "" },
      property: "",
      status: "",
      amountRange: { min: "", max: "" },
      searchTerm: "",
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.searchTerm ||
      localFilters.property ||
      localFilters.status ||
      localFilters.dateRange.start ||
      localFilters.dateRange.end ||
      localFilters.amountRange.min ||
      localFilters.amountRange.max
    );
  };

  // Get unique properties from payment history
  const uniqueProperties = [
    ...new Set(paymentHistory?.map((payment) => payment.property) || []),
  ];

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "completed", label: tStatus("completed") },
    { value: "pending", label: tStatus("pending") },
    { value: "failed", label: tStatus("failed") },
    { value: "disputed", label: tStatus("disputed") },
  ];

  const quickDateRanges = [
    { label: t("today"), days: 0 },
    { label: t("last7Days"), days: 7 },
    { label: t("last30Days"), days: 30 },
    { label: t("last90Days"), days: 90 },
  ];

  const setQuickDateRange = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start =
      days > 0
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : end;

    const newFilters = {
      ...localFilters,
      dateRange: { start, end },
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      {/* Basic Filters Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Icon
                name="Search"
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={localFilters.searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange("searchTerm", e.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Property Filter */}
          <div className="lg:w-48">
            <Select
              value={localFilters.property}
              onChange={(e) => handleFilterChange("property", e.target.value)}
            >
              <option value="">{t("allProperties")}</option>
              {uniqueProperties.map((property) => (
                <option key={property} value={property}>
                  {property}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-40">
            <Select
              value={localFilters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Toggle Advanced Filters */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
            >
              {t("advanced")}
            </Button>

            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                iconName="X"
                className="text-text-secondary hover:text-error"
              >
                {t("clear")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-border-light p-4 bg-secondary-25">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                {t("dateRange")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={localFilters.dateRange.start}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDateRangeChange("start", e.target.value)
                  }
                  placeholder={t("startDate")}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={localFilters.dateRange.end}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateRangeChange("end", e.target.value)}
                  placeholder={t("endDate")}
                  className="text-sm"
                />
              </div>

              {/* Quick Date Range Buttons */}
              <div className="flex flex-wrap gap-1">
                {quickDateRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setQuickDateRange(range.days)}
                    className="px-2 py-1 text-xs bg-secondary-100 text-text-secondary rounded hover:bg-secondary-200 transition-smooth"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Range */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                {t("amountRange")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={localFilters.amountRange.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAmountRangeChange("min", e.target.value)
                  }
                  placeholder={t("minAmount")}
                  className="text-sm"
                />
                <Input
                  type="number"
                  value={localFilters.amountRange.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAmountRangeChange("max", e.target.value)
                  }
                  placeholder={t("maxAmount")}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                {t("quickActions")}
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange("status", "pending")}
                  className="w-full text-left px-3 py-2 text-sm bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-smooth"
                >
                  <Icon name="Clock" size={14} className="inline mr-2" />
                  {t("showPendingOnly")}
                </button>
                <button
                  onClick={() => handleFilterChange("status", "overdue")}
                  className="w-full text-left px-3 py-2 text-sm bg-error-50 text-error-700 rounded-lg hover:bg-error-100 transition-smooth"
                >
                  <Icon name="AlertCircle" size={14} className="inline mr-2" />
                  {t("showOverdueOnly")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentFilters;
