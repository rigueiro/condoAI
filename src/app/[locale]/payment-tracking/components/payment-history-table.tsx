// src/pages/payment-tracking/components/PaymentHistoryTable.jsx
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import type { MockPayment } from "../__fixtures__/mock-payments";

interface PaymentHistoryTableProps {
  payments: MockPayment[];
  selectedPayments: number[];
  onPaymentSelect: (paymentId: number, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onViewReceipt: (payment: any) => void;
  onSendReminder: (payment: any) => void;
  onMarkDisputed: (payment: any) => void;
}

interface SortConfig {
  key: keyof MockPayment | null;
  direction: "asc" | "desc";
}

function SortableHeader({
  children,
  sortKey,
  className = "",
  sortConfig,
  onSort,
}: {
  children: React.ReactNode;
  sortKey: keyof MockPayment;
  className?: string;
  sortConfig: SortConfig;
  onSort: (key: keyof MockPayment) => void;
}) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-secondary-50 transition-smooth ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <Icon
            name="ChevronUp"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "asc" ? "text-primary" : "text-secondary-300"}`}
          />
          <Icon
            name="ChevronDown"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "desc" ? "text-primary" : "text-secondary-300"} -mt-1`}
          />
        </div>
      </div>
    </th>
  );
}

function PaymentHistoryTable({
  payments,
  selectedPayments,
  onPaymentSelect,
  onSelectAll,
  onViewReceipt,
  onSendReminder,
  onMarkDisputed,
}: PaymentHistoryTableProps) {
  const t = useTranslations("paymentTracking.paymentHistoryTable");
  const tStatus = useTranslations("paymentTracking.status");
  const tMethods = useTranslations("paymentTracking.paymentMethods");

  const translateMethod = (method: string) => {
    const keyMap: Record<string, string> = {
      "Bank Transfer": "bankTransfer",
      "Credit Card": "creditCard",
      Check: "check",
      Cash: "cash",
      Online: "online",
      "Online Payment": "onlinePayment",
    };
    const key = keyMap[method];
    return key ? tMethods(key as "bankTransfer") : method;
  };

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  const handleSort = (key: keyof MockPayment) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedPayments = useMemo(() => {
    const sortKey = sortConfig.key;
    if (!sortKey) return payments;

    return [...payments].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [payments, sortConfig]);

  const { formatCurrency } = useFormatCurrency();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: MockPayment["status"]) => {
    const statusConfig: Record<
      MockPayment["status"],
      { color: string; bg: string; label: string; icon: string }
    > = {
      completed: {
        color: "text-success",
        bg: "bg-success-100",
        label: tStatus("completed"),
        icon: "CheckCircle",
      },
      pending: {
        color: "text-warning",
        bg: "bg-warning-100",
        label: tStatus("pending"),
        icon: "Clock",
      },
      failed: {
        color: "text-error",
        bg: "bg-error-100",
        label: tStatus("failed"),
        icon: "XCircle",
      },
      disputed: {
        color: "text-orange-600",
        bg: "bg-orange-100",
        label: tStatus("disputed"),
        icon: "AlertTriangle",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        <Icon name={config.icon} size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodIcons: Record<string, string> = {
      "Bank Transfer": "Banknote",
      "Credit Card": "CreditCard",
      Check: "FileText",
      Cash: "Coins",
      Online: "Globe",
    };
    return methodIcons[method] || "CreditCard";
  };

  const allSelected =
    payments.length > 0 && selectedPayments.length === payments.length;
  const someSelected =
    selectedPayments.length > 0 && selectedPayments.length < payments.length;

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      <div className="px-6 py-4 border-b border-border-light">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          {selectedPayments.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">
                {t("selected", { count: selectedPayments.length })}
              </span>
              <button className="text-sm text-primary hover:text-primary-600 font-medium">
                {t("exportSelected")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border-medium text-primary focus:ring-primary"
                />
              </th>
              <SortableHeader
                sortKey="date"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("date")}
              </SortableHeader>
              <SortableHeader
                sortKey="ownerName"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("owner")}
              </SortableHeader>
              <SortableHeader
                sortKey="property"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("propertyUnit")}
              </SortableHeader>
              <SortableHeader
                sortKey="amount"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("amount")}
              </SortableHeader>
              <SortableHeader
                sortKey="paymentMethod"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("method")}
              </SortableHeader>
              <SortableHeader
                sortKey="status"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("status")}
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {sortedPayments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-secondary-50 transition-smooth"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(payment.id)}
                    onChange={(e) =>
                      onPaymentSelect(payment.id, e.target.checked)
                    }
                    className="rounded border-border-medium text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {formatDate(payment.date)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {payment.receiptNumber}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {payment.ownerName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {payment.property}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {t("unit", { unit: payment.unit })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {formatCurrency(payment.amount)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Icon
                      name={getPaymentMethodIcon(payment.paymentMethod)}
                      size={16}
                      className="text-text-secondary"
                    />
                    <span className="text-sm text-text-primary">
                      {translateMethod(payment.paymentMethod)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewReceipt(payment)}
                      className="p-1 text-text-secondary hover:text-primary transition-smooth"
                      title={t("viewReceipt")}
                    >
                      <Icon name="FileText" size={16} />
                    </button>
                    {(payment.status === "pending" ||
                      payment.status === "failed") && (
                      <button
                        onClick={() => onSendReminder(payment)}
                        className="p-1 text-text-secondary hover:text-warning transition-smooth"
                        title={t("sendReminder")}
                      >
                        <Icon name="Mail" size={16} />
                      </button>
                    )}
                    {payment.status !== "disputed" && (
                      <button
                        onClick={() => onMarkDisputed(payment)}
                        className="p-1 text-text-secondary hover:text-error transition-smooth"
                        title={t("markDisputed")}
                      >
                        <Icon name="AlertTriangle" size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Timeline Cards */}
      <div className="lg:hidden divide-y divide-border-light">
        {sortedPayments.map((payment) => (
          <div key={payment.id} className="p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedPayments.includes(payment.id)}
                onChange={(e) => onPaymentSelect(payment.id, e.target.checked)}
                className="mt-1 rounded border-border-medium text-primary focus:ring-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {payment.ownerName}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {payment.property} • {t("unit", { unit: payment.unit })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {formatDate(payment.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon
                      name={getPaymentMethodIcon(payment.paymentMethod)}
                      size={14}
                      className="text-text-secondary"
                    />
                    <span className="text-xs text-text-secondary">
                      {payment.paymentMethod}
                    </span>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-text-secondary">
                    {payment.receiptNumber}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onViewReceipt(payment)}
                      className="p-1 text-text-secondary hover:text-primary transition-smooth"
                    >
                      <Icon name="FileText" size={14} />
                    </button>
                    {(payment.status === "pending" ||
                      payment.status === "failed") && (
                      <button
                        onClick={() => onSendReminder(payment)}
                        className="p-1 text-text-secondary hover:text-warning transition-smooth"
                      >
                        <Icon name="Mail" size={14} />
                      </button>
                    )}
                    {payment.status !== "disputed" && (
                      <button
                        onClick={() => onMarkDisputed(payment)}
                        className="p-1 text-text-secondary hover:text-error transition-smooth"
                      >
                        <Icon name="AlertTriangle" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {payments.length === 0 && (
        <div className="text-center py-12">
          <Icon
            name="CreditCard"
            size={48}
            className="mx-auto text-secondary-300 mb-4"
          />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {t("noResults")}
          </h3>
          <p className="text-text-secondary">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryTable;
