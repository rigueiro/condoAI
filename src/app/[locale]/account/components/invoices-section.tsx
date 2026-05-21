"use client";

import React, { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import type { Invoice, InvoiceStatus } from "../types";

interface InvoicesSectionProps {
  invoices: Invoice[];
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "bg-success-50 text-success",
  pending: "bg-warning-50 text-warning",
  failed: "bg-error-50 text-error",
  refunded: "bg-secondary-100 text-text-secondary",
};

function InvoicesSection({ invoices }: InvoicesSectionProps) {
  const t = useTranslations("account.invoices");
  const tStatus = useTranslations("account.invoices.statuses");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 mx-auto rounded-full bg-secondary-100 flex items-center justify-center text-text-secondary">
          <Icon name="FileText" size={20} />
        </div>
        <h3 className="mt-3 text-sm font-medium text-text-primary">
          {t("empty")}
        </h3>
        <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto">
          {t("emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border-light">
            <th className="font-medium py-3 pr-4">{t("number")}</th>
            <th className="font-medium py-3 pr-4">{t("date")}</th>
            <th className="font-medium py-3 pr-4">{t("amount")}</th>
            <th className="font-medium py-3 pr-4">{t("status")}</th>
            <th className="font-medium py-3 pr-4 sr-only">{t("download")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-secondary-50 transition-smooth">
              <td className="py-3 pr-4">
                <span className="font-medium text-text-primary">
                  {invoice.number}
                </span>
              </td>
              <td className="py-3 pr-4 text-text-secondary">
                {dateFormatter.format(new Date(invoice.date))}
              </td>
              <td className="py-3 pr-4 text-text-primary font-medium">
                {formatCurrency(invoice.amount)}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[invoice.status]}`}
                >
                  {tStatus(invoice.status)}
                </span>
              </td>
              <td className="py-3 pr-4 text-right">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-700 transition-smooth"
                >
                  <Icon name="Download" size={14} />
                  <span>{t("download")}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesSection;
