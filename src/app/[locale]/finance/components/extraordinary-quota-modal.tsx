"use client";

import React, { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { todayKey } from "@/lib/collections/dates";
import {
  allocateExtraordinary,
  ownerCountFromAllocations,
  type IssueExtraordinaryInput,
} from "@/lib/finance";
import type { Owner, Unit } from "@/types";

type CondoOption = { id: string; name: string };

function ExtraordinaryQuotaModal({
  condominiums,
  units,
  owners,
  onClose,
  onIssue,
}: {
  condominiums: CondoOption[];
  units: Unit[];
  owners: Owner[];
  onClose: () => void;
  onIssue: (input: IssueExtraordinaryInput) => Promise<boolean>;
}) {
  const t = useTranslations("finance");
  const { formatCurrency } = useFormatCurrency();
  const [condominiumId, setCondominiumId] = useState(condominiums[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [dueDate, setDueDate] = useState(todayKey());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { ownerIds, ownerNameById } = useMemo(() => {
    const ownerIds = new Set<string>();
    const ownerNameById = new Map<string, string>();
    for (const owner of owners) {
      ownerIds.add(owner.id);
      ownerNameById.set(owner.id, owner.fullName);
    }
    return { ownerIds, ownerNameById };
  }, [owners]);

  const amount = Number(totalAmount);
  const allocations = useMemo(() => {
    if (!condominiumId || !Number.isFinite(amount) || amount <= 0) return [];
    return allocateExtraordinary(units, condominiumId, amount, ownerIds);
  }, [amount, condominiumId, ownerIds, units]);

  const billedOwners = ownerCountFromAllocations(allocations);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!condominiumId) next.condominiumId = t("modal.validation.condominiumRequired");
    if (!description.trim()) {
      next.description = t("extraordinary.validation.descriptionRequired");
    }
    if (!totalAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      next.totalAmount = t("modal.validation.amountRequired");
    }
    if (!date) next.date = t("modal.validation.dateRequired");
    if (!dueDate) next.dueDate = t("modal.validation.dateRequired");
    if (Object.keys(next).length === 0 && allocations.length === 0) {
      next.totalAmount = t("extraordinary.validation.noOwners");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const ok = await onIssue({
      condominiumId,
      description: description.trim(),
      totalAmount: amount,
      date,
      dueDate,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("modal.cancel")}
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("extraordinary.modalTitle")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t("extraordinary.modalSubtitle")}
            </p>
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
          <div>
            <label className={labelClass}>{t("modal.condominium")}</label>
            <Select
              value={condominiumId}
              onChange={(e) => setCondominiumId(e.target.value)}
            >
              {condominiums.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.condominiumId && (
              <p className="mt-1 text-xs text-error">{errors.condominiumId}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("extraordinary.description")}</label>
            <input
              className={fieldClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("extraordinary.descriptionPlaceholder")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-error">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("extraordinary.total")}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClass}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
              {errors.totalAmount && (
                <p className="mt-1 text-xs text-error">{errors.totalAmount}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>{t("extraordinary.date")}</label>
              <input
                type="date"
                className={fieldClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-error">{errors.date}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("extraordinary.dueDate")}</label>
            <input
              type="date"
              className={fieldClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-error">{errors.dueDate}</p>
            )}
          </div>

          <div className="rounded-lg border border-border-light bg-secondary-50 px-3 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">
                {t("extraordinary.preview")}
              </span>
              <span className="text-text-secondary">
                {t("extraordinary.billedOwners", { count: billedOwners })}
              </span>
            </div>
            {allocations.length === 0 ? (
              <p className="text-xs text-text-secondary">
                {t("extraordinary.previewEmpty")}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-text-secondary">
                    <tr>
                      <th className="pb-1 font-medium">
                        {t("extraordinary.unit")}
                      </th>
                      <th className="pb-1 font-medium">
                        {t("extraordinary.owner")}
                      </th>
                      <th className="pb-1 text-right font-medium">
                        {t("extraordinary.amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {allocations.map((row) => (
                      <tr key={row.unitId}>
                        <td className="py-1 text-text-primary">{row.unitLabel}</td>
                        <td className="py-1 text-text-secondary">
                          {ownerNameById.get(row.ownerId) ?? row.ownerId}
                        </td>
                        <td className="py-1 text-right text-text-primary">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? t("extraordinary.issuing") : t("extraordinary.issue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExtraordinaryQuotaModal;
