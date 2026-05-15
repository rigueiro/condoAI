import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";

type Field = {
  id: string;
  label: string;
  category: string;
};

type ReportConfig = {
  name: string;
  description: string;
  format: string;
  delivery: string;
  schedule: string;
  recipients: string[];
  selectedFields: string[];
  includeCharts: boolean;
  includeRawData: boolean;
};

type GroupedFields = Record<string, Field[]>;

function GenerateReportSection({
  onGenerateReport,
}: {
  onGenerateReport: (config: ReportConfig) => void;
}) {
  const t = useTranslations("reportsAnalytics.generateReportSection");
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: "",
    description: "",
    format: "pdf",
    delivery: "manual",
    schedule: "monthly",
    recipients: [],
    selectedFields: [],
    includeCharts: true,
    includeRawData: false,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");

  const reportFormats = [
    { value: "pdf", label: "PDF Document", icon: "FileText" },
    { value: "excel", label: "Excel Spreadsheet", icon: "FileSpreadsheet" },
    { value: "csv", label: "CSV Data", icon: "Database" },
    { value: "html", label: "Web Report", icon: "Globe" },
  ] as { value: string; label: string; icon: string }[];

  const deliveryOptions = [
    { value: "manual", label: "Manual Download" },
    { value: "email", label: "Email Delivery" },
    { value: "scheduled", label: "Scheduled Delivery" },
  ] as { value: string; label: string }[];

  const scheduleOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
  ] as { value: string; label: string }[];

  const availableFields = [
    { id: "property-info", label: "Property Information", category: "Basic" },
    { id: "owner-details", label: "Owner Details", category: "Basic" },
    { id: "unit-info", label: "Unit Information", category: "Basic" },
    { id: "payment-history", label: "Payment History", category: "Financial" },
    {
      id: "outstanding-balances",
      label: "Outstanding Balances",
      category: "Financial",
    },
    {
      id: "collection-rates",
      label: "Collection Rates",
      category: "Financial",
    },
    {
      id: "maintenance-requests",
      label: "Maintenance Requests",
      category: "Operations",
    },
    { id: "board-minutes", label: "Board Minutes", category: "Governance" },
    { id: "budget-variance", label: "Budget Variance", category: "Financial" },
    { id: "compliance-status", label: "Compliance Status", category: "Legal" },
  ] as Field[];

  const handleFieldToggle = (fieldId: string) => {
    setReportConfig((prev) => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldId)
        ? prev.selectedFields.filter((id) => id !== fieldId)
        : [...prev.selectedFields, fieldId],
    }));
  };

  const handleAddRecipient = () => {
    if (
      newRecipient.trim() &&
      !reportConfig.recipients.includes(newRecipient)
    ) {
      setReportConfig((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()],
      }));
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setReportConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleGenerateReport = () => {
    if (!reportConfig.name.trim()) {
      alert(t("validation.nameRequired"));
      return;
    }

    if (reportConfig.selectedFields.length === 0) {
      alert(t("validation.fieldsRequired"));
      return;
    }

    onGenerateReport?.(reportConfig);
  };

  const groupedFields = availableFields.reduce<GroupedFields>((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {});

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light">
      {/* Section Header */}
      <div className="p-6 border-b border-border-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <Icon name="Settings" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {t("title")}
              </h2>
              <p className="text-sm text-text-secondary">{t("subtitle")}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon
              name={isExpanded ? "ChevronUp" : "ChevronDown"}
              size={16}
              className="mr-2"
            />
            {isExpanded ? t("collapse") : t("expand")}
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <div
        className={`transition-all duration-300 ${isExpanded ? "block" : "hidden"}`}
      >
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Report Name *
              </label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={(e) =>
                  setReportConfig((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("reportNamePlaceholder")}
                className="w-full px-4 py-2 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <input
                type="text"
                value={reportConfig.description}
                onChange={(e) =>
                  setReportConfig((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("descriptionPlaceholder")}
                className="w-full px-4 py-2 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Report Format
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {reportFormats.map((format) => (
                <label
                  key={format.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    reportConfig.format === format.value
                      ? "border-primary bg-primary-50"
                      : "border-border-light hover:border-border-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={reportConfig.format === format.value}
                    onChange={(e) =>
                      setReportConfig((prev) => ({
                        ...prev,
                        format: e.target.value,
                      }))
                    }
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2">
                    <Icon
                      name={format.icon}
                      size={16}
                      className={
                        reportConfig.format === format.value
                          ? "text-primary"
                          : "text-text-secondary"
                      }
                    />
                    <span
                      className={`text-sm ${
                        reportConfig.format === format.value
                          ? "text-primary font-medium"
                          : "text-text-primary"
                      }`}
                    >
                      {format.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Delivery Method
              </label>
              <select
                value={reportConfig.delivery}
                onChange={(e) =>
                  setReportConfig((prev) => ({
                    ...prev,
                    delivery: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {deliveryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {reportConfig.delivery === "scheduled" && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Schedule
                </label>
                <select
                  value={reportConfig.schedule}
                  onChange={(e) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      schedule: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {scheduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(reportConfig.delivery === "email" ||
              reportConfig.delivery === "scheduled") && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Recipients
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="flex-1 px-3 py-2 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    onKeyUp={(e) => e.key === "Enter" && handleAddRecipient()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecipient}
                  >
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>

                {reportConfig.recipients.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {reportConfig.recipients.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-secondary-50 px-3 py-2 rounded"
                      >
                        <span className="text-sm text-text-primary">
                          {email}
                        </span>
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="text-text-secondary hover:text-error transition-colors"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Data Fields to Include *
            </label>

            <div className="space-y-4">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <div
                  key={category}
                  className="border border-border-light rounded-lg p-4"
                >
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields.map((field) => (
                      <label
                        key={field.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={reportConfig.selectedFields.includes(
                            field.id,
                          )}
                          onChange={() => handleFieldToggle(field.id)}
                          className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
                        />
                        <span className="text-sm text-text-primary">
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Additional Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeCharts}
                  onChange={(e) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      includeCharts: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
                />
                <span className="text-sm text-text-primary">
                  Include charts and graphs
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeRawData}
                  onChange={(e) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      includeRawData: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
                />
                <span className="text-sm text-text-primary">
                  Include raw data tables
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-border-light bg-secondary-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              {reportConfig.selectedFields.length} fields selected
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Icon name="Save" size={16} className="mr-2" />
                Save Template
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                disabled={
                  !reportConfig.name.trim() ||
                  reportConfig.selectedFields.length === 0
                }
              >
                <Icon name="Download" size={16} className="mr-2" />
                {t("generateReport")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Generate (when collapsed) */}
      {!isExpanded && (
        <div className="p-6">
          <div className="text-center space-y-4">
            <p className="text-text-secondary">
              Quickly generate reports using predefined templates or create
              custom reports
            </p>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" size="sm">
                <Icon name="Zap" size={16} className="mr-2" />
                Quick Financial Report
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Custom Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateReportSection;
