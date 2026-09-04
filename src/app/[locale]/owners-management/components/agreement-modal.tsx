"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatIsoDate, isIsoDate, todayKey } from "@/lib/collections/dates";
import {
  DEFAULT_MORA_RATE_ANNUAL,
  INSTALLMENT_COUNTS,
  MAX_MORA_RATE_ANNUAL,
  previewAgreement,
  type AccountCharge,
  type AccountReceipt,
  type CreateAgreementInput,
} from "@/lib/collections";
import type { QuotaPayment } from "@/types";

function AgreementModal({
  ownerId,
  condominiumId,
  quotas,
  charges,
  receipts,
  onClose,
  onCreate,
}: {
  ownerId: string;
  condominiumId: string;
  quotas: QuotaPayment[];
  charges: AccountCharge[];
  receipts: AccountReceipt[];
  onClose: () => void;
  onCreate: (input: CreateAgreementInput) => Promise<boolean>;
}) {
  const t = useTranslations("ownersManagement.agreement");
  const tModal = useTranslations("ownersManagement.modal");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();

  const [startDate, setStartDate] = useState(todayKey());
  const [installmentCount, setInstallmentCount] = useState(6);
  const [includeMora, setIncludeMora] = useState(false);
  const [moraRateAnnual, setMoraRateAnnual] = useState(
    String(DEFAULT_MORA_RATE_ANNUAL),
  );
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rate = Number.parseFloat(moraRateAnnual);
  const preview = useMemo(
    () =>
      previewAgreement(ownerId, quotas, charges, receipts, {
        startDate,
        installmentCount,
        includeMora,
        moraRateAnnual: Number.isFinite(rate) ? rate : 0,
      }),
    [
      charges,
      includeMora,
      installmentCount,
      ownerId,
      quotas,
      rate,
      receipts,
      startDate,
    ],
  );

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isIsoDate(startDate)) {
      next.startDate = t("validation.dateRequired");
    }
    if (preview.principal <= 0) next.principal = t("validation.noDebt");
    if (
      includeMora &&
      (!Number.isFinite(rate) || rate < 0 || rate > MAX_MORA_RATE_ANNUAL)
    ) {
      next.moraRate = t("validation.moraRate");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const ok = await onCreate({
        ownerId,
        condominiumId,
        startDate,
        installmentCount,
        includeMora,
        moraRateAnnual: includeMora ? moraRateAnnual : 0,
        notes,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={tModal("cancel")}
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary disabled:opacity-50"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-border-light bg-secondary-50 px-3 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-text-secondary">{t("principal")}</span>
              <span className="tabular-nums font-medium text-text-primary">
                {formatCurrency(preview.principal)}
              </span>
            </div>
            {preview.oldestDue && (
              <p className="mt-1 text-xs text-text-secondary">
                {t("oldestDue", {
                  date: formatIsoDate(preview.oldestDue, locale),
                  days: preview.moraDays,
                })}
              </p>
            )}
            {errors.principal && (
              <p className="mt-1 text-xs text-error">{errors.principal}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("startDate")}</label>
            <input
              type="date"
              className={fieldClass}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-error">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("installments")}</label>
            <select
              className={fieldClass}
              value={installmentCount}
              onChange={(event) =>
                setInstallmentCount(Number(event.target.value))
              }
            >
              {INSTALLMENT_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {t("installmentCount", { count })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={includeMora}
                onChange={(event) => setIncludeMora(event.target.checked)}
              />
              {t("includeMora")}
            </label>
            {includeMora && (
              <div>
                <label className={labelClass}>{t("moraRate")}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={MAX_MORA_RATE_ANNUAL}
                    step="0.1"
                    className={`${fieldClass} pr-8`}
                    value={moraRateAnnual}
                    onChange={(event) => setMoraRateAnnual(event.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                    %
                  </span>
                </div>
                {errors.moraRate && (
                  <p className="mt-1 text-xs text-error">{errors.moraRate}</p>
                )}
                <p className="mt-1 text-xs text-text-secondary">
                  {t("moraHint")}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("notes")}</label>
            <textarea
              className={`${fieldClass} min-h-16`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("notesPlaceholder")}
            />
          </div>

          <div className="rounded-lg border border-border-light px-3 py-3">
            <p className="mb-2 text-sm font-medium text-text-primary">
              {t("preview")}
            </p>
            <div className="mb-3 space-y-1 text-sm">
              {includeMora && (
                <div className="flex justify-between gap-4 text-text-secondary">
                  <span>{t("moraAmount")}</span>
                  <span className="tabular-nums">
                    {formatCurrency(preview.moraAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 font-medium text-text-primary">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  {formatCurrency(preview.total)}
                </span>
              </div>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-text-secondary">
              {preview.installments.map((item) => (
                <li
                  key={item.sequence}
                  className="flex justify-between gap-4"
                >
                  <span>
                    {t("installmentRow", { n: item.sequence })} ·{" "}
                    {formatIsoDate(item.dueDate, locale)}
                  </span>
                  <span className="tabular-nums font-medium text-text-primary">
                    {formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-50"
            >
              {tModal("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || preview.principal <= 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? t("saving") : t("confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgreementModal;
