"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatIsoDate } from "@/lib/collections/dates";
import {
  remainingAgreementTotal,
  type PaymentAgreement,
  type PaymentInstallment,
  type RecordPaymentInput,
} from "@/lib/collections";
import RecordPaymentModal, {
  type RecordPaymentInitialValues,
} from "@/app/[locale]/payment-tracking/components/record-payment-modal";

const STATUS_CLASS: Record<PaymentAgreement["status"], string> = {
  active: "bg-primary-100 text-primary",
  completed: "bg-success-100 text-success",
  defaulted: "bg-error-100 text-error",
  cancelled: "bg-secondary-100 text-text-secondary",
};

const INSTALLMENT_CLASS: Record<PaymentInstallment["status"], string> = {
  pending: "text-warning",
  paid: "text-success",
  overdue: "text-error",
};

function AgreementPanel({
  agreement,
  ownerId,
  onPay,
  onDefault,
  onCancel,
  onIssueCertificate,
}: {
  agreement: PaymentAgreement;
  ownerId: string;
  onPay: (input: RecordPaymentInput & { installmentId: string }) => Promise<boolean>;
  onDefault: () => Promise<boolean>;
  onCancel: () => Promise<boolean>;
  onIssueCertificate: () => void;
}) {
  const t = useTranslations("ownersManagement.agreement");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();
  const [paying, setPaying] = useState<PaymentInstallment | null>(null);
  const [busy, setBusy] = useState<"default" | "cancel" | null>(null);

  const nextUnpaid = agreement.installments.find(
    (item) => item.status !== "paid",
  );
  const remaining = remainingAgreementTotal(agreement);
  const canCancel =
    agreement.status === "active" &&
    agreement.installments.every((item) => item.status !== "paid");

  const handlePay = async (data: RecordPaymentInput) => {
    if (!paying) return;
    const ok = await onPay({ ...data, installmentId: paying.id });
    if (ok) setPaying(null);
  };

  const runBusy = async (
    kind: "default" | "cancel",
    action: () => Promise<boolean>,
  ) => {
    setBusy(kind);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="bg-surface rounded-lg border border-border-light p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("panelTitle")}
          </h2>
          <p className="mt-1 font-mono text-sm text-text-secondary">
            {agreement.number}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[agreement.status]}`}
        >
          {t(`status.${agreement.status}`)}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-text-secondary">{t("principal")}</p>
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {formatCurrency(agreement.principal)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">{t("moraAmount")}</p>
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {agreement.moraAmount > 0
              ? formatCurrency(agreement.moraAmount)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">{t("total")}</p>
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {formatCurrency(agreement.total)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">{t("remaining")}</p>
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {agreement.notes && (
        <p className="mb-4 text-sm text-text-secondary">{agreement.notes}</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-light text-left text-xs uppercase tracking-wider text-text-secondary">
              <th className="py-2 pr-3 font-medium">{t("columns.n")}</th>
              <th className="py-2 pr-3 font-medium">{t("columns.due")}</th>
              <th className="py-2 pr-3 text-right font-medium">
                {t("columns.amount")}
              </th>
              <th className="py-2 pr-3 font-medium">{t("columns.status")}</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {agreement.installments.map((item) => {
              const isNext = nextUnpaid?.id === item.id;
              return (
                <tr key={item.id}>
                  <td className="py-2 pr-3 tabular-nums">{item.sequence}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {formatIsoDate(item.dueDate, locale)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                  <td
                    className={`py-2 pr-3 text-xs font-medium ${INSTALLMENT_CLASS[item.status]}`}
                  >
                    {t(`installmentStatus.${item.status}`)}
                    {item.paidAt
                      ? ` · ${formatIsoDate(item.paidAt, locale)}`
                      : ""}
                  </td>
                  <td className="py-2 text-right">
                    {agreement.status === "active" && isNext && (
                      <button
                        type="button"
                        onClick={() => setPaying(item)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("recordInstallment")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {agreement.status === "active" && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={busy === "cancel"}
              disabled={Boolean(busy)}
              onClick={() => runBusy("cancel", onCancel)}
            >
              {t("cancelPlan")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy === "default"}
            disabled={Boolean(busy)}
            onClick={() => runBusy("default", onDefault)}
          >
            {t("markDefaulted")}
          </Button>
        </div>
      )}

      {agreement.status === "defaulted" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-3 text-sm">
          <p className="text-error">{t("defaultedHint")}</p>
          <Button
            type="button"
            size="sm"
            iconName="ScrollText"
            onClick={onIssueCertificate}
          >
            {t("issueCertificate")}
          </Button>
        </div>
      )}

      <RecordPaymentModal
        isOpen={Boolean(paying)}
        onClose={() => setPaying(null)}
        onSubmit={handlePay}
        initialValues={
          {
            ownerId,
            amount: paying?.amount,
            notes: paying
              ? t("paymentNotes", {
                  number: agreement.number,
                  n: paying.sequence,
                  total: agreement.installmentCount,
                })
              : undefined,
          } satisfies RecordPaymentInitialValues
        }
      />
    </section>
  );
}

export default AgreementPanel;
