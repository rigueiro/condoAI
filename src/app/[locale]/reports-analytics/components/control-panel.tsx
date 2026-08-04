import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { format } from "date-fns";
import { mockCondominiums } from "@/fixtures/domain";

type DataRange = {
  start: Date;
  end: Date;
} | null;

export type Filters = {
  dateRange: DataRange;
  selectedProperties: string[];
  reportType: string;
};

function ControlPanel({
  filters,
  onFilterChange,
}: {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}) {
  const t = useTranslations("reportsAnalytics.controlPanel");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState(filters?.dateRange);

  const reportTypes = [
    { value: "financial-summary", label: t("reportTypes.financialSummary") },
    { value: "collection-rates", label: t("reportTypes.collectionRates") },
    { value: "owner-statements", label: t("reportTypes.ownerStatements") },
    {
      value: "outstanding-balances",
      label: t("reportTypes.outstandingBalances"),
    },
    {
      value: "property-performance",
      label: t("reportTypes.propertyPerformance"),
    },
    { value: "payment-trends", label: t("reportTypes.paymentTrends") },
  ];

  const propertyOptions = [
    { id: "all", name: t("allProperties") },
    ...mockCondominiums.map((c) => ({ id: c.id, name: c.name })),
  ];

  const presetRanges = [
    { label: t("last30Days"), days: 30 },
    { label: t("last3Months"), days: 90 },
    { label: t("last6Months"), days: 180 },
    { label: t("lastYear"), days: 365 },
    { label: t("yearToDate"), days: "ytd" as const },
  ];

  const handleDateRangeChange = (range: {
    label: string;
    days: number | "ytd";
  }) => {
    const now = new Date();
    let start,
      end = now;

    if (range.days === "ytd") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
    }

    const newDateRange = { start, end };
    setTempDateRange(newDateRange);
    onFilterChange?.({ dateRange: newDateRange });
    setShowDatePicker(false);
  };

  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange?.({ reportType: e.target.value });
  };

  const handlePropertyChange = (propertyId: string) => {
    const selectedProperties = filters?.selectedProperties || [];

    if (propertyId === "all") {
      onFilterChange?.({ selectedProperties: [] });
    } else {
      const isSelected = selectedProperties.includes(propertyId);
      const newSelection = isSelected
        ? selectedProperties.filter((id) => id !== propertyId)
        : [...selectedProperties, propertyId];

      onFilterChange?.({ selectedProperties: newSelection });
    }
  };

  const formatDateRange = () => {
    if (!filters?.dateRange?.start || !filters?.dateRange?.end)
      return t("selectDateRange");

    const start = format(filters.dateRange.start, "MMM d, yyyy");
    const end = format(filters.dateRange.end, "MMM d, yyyy");
    return `${start} - ${end}`;
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("dateRange")}
          </label>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full justify-between text-left"
            >
              <div className="flex items-center space-x-2">
                <Icon
                  name="Calendar"
                  size={16}
                  className="text-text-secondary"
                />
                <span className="text-sm">{formatDateRange()}</span>
              </div>
              <Icon
                name="ChevronDown"
                size={16}
                className={`text-text-secondary transition-transform ${
                  showDatePicker ? "rotate-180" : ""
                }`}
              />
            </Button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border-light rounded-lg shadow-modal z-50 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary mb-3">
                    {t("quickSelect")}
                  </p>
                  {presetRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateRangeChange(range)}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-secondary-50 rounded transition-colors"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("reportType")}
          </label>
          <Select
            value={filters?.reportType || "financial-summary"}
            onChange={handleReportTypeChange}
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("properties")}
          </label>
          <div className="relative">
            <div className="bg-surface border border-border-light rounded-lg p-3 max-h-32 overflow-y-auto">
              {propertyOptions.map((property) => {
                const isSelected =
                  property.id === "all"
                    ? (filters?.selectedProperties?.length || 0) === 0
                    : filters?.selectedProperties?.includes(property.id);
                return (
                  <label
                    key={property.id}
                    className="flex items-center space-x-2 py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePropertyChange(property.id)}
                      className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
                    />
                    <span className="text-sm text-text-primary">
                      {property.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-end space-x-3">
          <Button variant="outline" size="sm">
            <Icon name="RotateCcw" size={16} className="mr-2" />
            {t("reset")}
          </Button>
          <Button className="text-white" variant="primary" size="sm">
            <Icon name="Search" size={16} className="mr-2" />
            {t("apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;