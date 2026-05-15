import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";

export enum PaymentStatus {
  Overdue = "OVERDUE",
  DueSoon = "DUE_SOON",
  Upcoming = "UPCOMING",
  Pending = "PENDING",
  Paid = "PAID",
}

type Payment = {
  id: number;
  ownerName: string;
  unit: string;
  property: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
};

type FormatCurrency = (amount: number) => string;

function UpcomingPayments({
  payments,
  formatCurrency,
}: {
  payments: Payment[];
  formatCurrency: FormatCurrency;
}) {
  const t = useTranslations("dashboard.upcomingPayments");
  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "bg-error-50 text-error-700 border-error-200";
      case "due_soon":
        return "bg-warning-50 text-warning-700 border-warning-200";
      case "upcoming":
        return "bg-secondary-50 text-secondary-700 border-secondary-200";
      default:
        return "bg-secondary-50 text-secondary-700 border-secondary-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return "AlertTriangle";
      case "due_soon":
        return "Clock";
      case "upcoming":
        return "Calendar";
      default:
        return "Calendar";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "overdue":
        return t("status.overdue");
      case "due_soon":
        return t("status.dueSoon");
      case "upcoming":
        return t("status.upcoming");
      default:
        return t("status.upcoming");
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return t("dueDate.overdue", { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t("dueDate.today");
    } else if (diffDays === 1) {
      return t("dueDate.tomorrow");
    } else {
      return t("dueDate.inDays", { days: diffDays });
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {t("title")}
        </h2>
        <Link
          href="/payment-tracking"
          className="text-primary hover:text-primary-700 text-sm font-medium transition-smooth"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="p-4 rounded-lg border border-border-light hover:border-primary-200 transition-smooth"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-text-primary">
                  {payment.ownerName}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {t("unitProperty", { unit: payment.unit, property: payment.property })}
                </p>
              </div>

              <div
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}
              >
                <Icon name={getStatusIcon(payment.status)} size={12} />
                <span>{getStatusText(payment.status)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatDueDate(payment.dueDate)}
                </p>
              </div>

              <button className="flex items-center space-x-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-xs font-medium">
                <Icon name="Plus" size={12} />
                <span>{t("record")}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-light">
        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/payment-tracking"
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium"
          >
            <Icon name="CreditCard" size={16} />
            <span>{t("managePayments")}</span>
          </Link>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-100 text-text-primary rounded-lg hover:bg-secondary-200 transition-smooth text-sm font-medium">
            <Icon name="Bell" size={16} />
            <span>{t("sendReminders")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpcomingPayments;
