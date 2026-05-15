import Icon from "@/components/icon";
import React from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";

const templates = [
  {
    id: "monthly-collection",
    nameKey: "monthlyCollection",
    icon: "DollarSign",
    iconColor: "var(--color-success)",
    config: { reportType: "collection-rates", dateRange: "last-month" },
  },
  {
    id: "annual-owner-statements",
    nameKey: "annualOwnerStatements",
    icon: "FileText",
    iconColor: "var(--color-primary)",
    config: { reportType: "owner-statements", dateRange: "last-year" },
  },
  {
    id: "property-performance",
    nameKey: "propertyPerformance",
    icon: "TrendingUp",
    iconColor: "var(--color-accent)",
    config: { reportType: "property-performance", dateRange: "last-quarter" },
  },
  {
    id: "outstanding-balances",
    nameKey: "outstandingBalances",
    icon: "AlertTriangle",
    iconColor: "var(--color-warning)",
    config: { reportType: "outstanding-balances", dateRange: "current" },
  },
  {
    id: "payment-trends",
    nameKey: "paymentTrends",
    icon: "BarChart3",
    iconColor: "var(--color-secondary)",
    config: { reportType: "payment-trends", dateRange: "last-6-months" },
  },
  {
    id: "board-summary",
    nameKey: "boardSummary",
    icon: "Users",
    iconColor: "var(--color-primary)",
    config: { reportType: "financial-summary", dateRange: "last-quarter" },
  },
] as const;

interface Config {
  reportType: string;
  dateRange: string;
}

type Template = (typeof templates)[number];

function ReportTemplates({
  onTemplateSelect,
}: {
  onTemplateSelect?: (config: Config) => void;
}) {
  const t = useTranslations("reportsAnalytics.reportTemplates");

  const handleTemplateClick = (template: Template) => {
    onTemplateSelect?.(template.config);
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light">
      <div className="p-6 border-b border-border-light">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="FileStack" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
        </div>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="p-4 space-y-3">        {templates.map((template) => (
          <div
            key={template.id}
            className="border border-border-light rounded-lg p-4 hover:bg-secondary-50 hover:border-border-medium transition-all cursor-pointer group"
            onClick={() => handleTemplateClick(template)}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center group-hover:bg-surface transition-colors">
                <Icon name={template.icon} size={20} color={template.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {t(`templates.${template.nameKey}.name`)}
                </h3>
                <p className="text-xs text-text-secondary line-clamp-2">
                  {t(`templates.${template.nameKey}.description`)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border-light">
        <Button variant="outline" size="sm" className="w-full">
          <Icon name="Plus" size={16} className="mr-2" />
          {t("createCustom")}
        </Button>
      </div>
    </div>
  );
}

export default ReportTemplates;
