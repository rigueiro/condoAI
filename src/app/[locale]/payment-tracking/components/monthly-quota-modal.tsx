"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { monthYearFromDate } from "@/lib/collections/dates";
import {
  isMonthYear,
  isOrdinaryRunId,
  previewOrdinaryMonth,
  yearFromMonthYear,
  type IssueOrdinaryInput,
} from "@/lib/collections/quota-run";
import { pickApprovedBudget } from "@/lib/reports/budget";
import type { AnnualBudget, Condominium, Owner, Unit } from "@/types";

function MonthlyQuotaModal({
  condominiums,
  units,
  owners,
  budgets,
  quotas,
  defaultCondominiumId,
  onClose,
  onIssue,
}: {
  condominiums: Pick<Condominium, "id" | "name" | "totalPermillage">[];
  units: Unit[];
  owners: Owner[];
  budgets: AnnualBudget[];
  quotas: { id: string; ownerId: string; monthYear: string }[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onIssue: (input: IssueOrdinaryInput) => Promise<boolean>;
}) {
  const t = useTranslations("paymentTracking.quotaRun");
  const tModal = useTranslations("finance.modal");
  const { formatCurrency } = useFormatCurrency();
  const [condominiumId, setCondominiumId] = useState(
    defaultCondominiumId ?? condominiums[0]?.id ?? "",
  );
  const [monthYear, setMonthYear] = useState(monthYearFromDate());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const condo = condominiums.find((item) => item.id === condominiumId);
  const year = yearFromMonthYear(monthYear);
  const budget = pickApprovedBudget(budgets, condominiumId, year);

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const owner of owners) map.set(owner.id, owner.fullName);
    return map;
  }, [owners]);

  const preview = useMemo(
    () =>
      previewOrdinaryMonth({
        units,
        condominiumId,
        totalPermillage: condo?.totalPermillage || 1000,
        budget,
      }),
    [budget, condominiumId, condo?.totalPermillage, units],
  );

  const alreadyIssued = useMemo(() => {
    const issued = new Set(
      quotas
        .filter(
          (quota) =>
            quota.monthYear === monthYear &&
            isOrdinaryRunId(quota.id, condominiumId),
        )
        .map((quota) => quota.ownerId),
    );
    return preview.rows.filter((row) => issued.has(row.ownerId)).length;
  }, [condominiumId, monthYear, preview.rows, quotas]);

  const allIssued =
    preview.rows.length > 0 && alreadyIssued === preview.rows.length;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!condominiumId) next.condominiumId = tModal("validation.condominiumRequired");
    if (!isMonthYear(monthYear)) next.monthYear = t("validation.monthRequired");
    if (!budget) next.budget = t("validation.noApprovedBudget");
    else if (preview.rows.length === 0) next.budget = t("validation.noOwners");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const ok = await onIssue({ condominiumId, monthYear });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

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
              {t("modalTitle")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{t("modalSubtitle")}</p>
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
            <label className={labelClass}>{tModal("condominium")}</label>
            <Select
              value={condominiumId}
              onChange={(e) => setCondominiumId(e.target.value)}
            >
              {condominiums.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            {errors.condominiumId && (
              <p className="mt-1 text-xs text-error">{errors.condominiumId}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("month")}</label>
            <input
              type="month"
              className={fieldClass}
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
            />
            {errors.monthYear && (
              <p className="mt-1 text-xs text-error">{errors.monthYear}</p>
            )}
          </div>

          {errors.budget && (
            <p className="text-sm text-error">{errors.budget}</p>
          )}

          <div className="rounded-lg border border-border-light bg-secondary-50 px-3 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">{t("preview")}</span>
              <span className="text-text-secondary">
                {budget ? t("budgetYear", { year }) : null}
              </span>
            </div>
            {budget && (
              <p className="mb-2 text-xs text-text-secondary">
                {t("monthlyTotal", {
                  amount: formatCurrency(preview.monthlyTotal),
                })}
                {alreadyIssued > 0
                  ? ` · ${t("alreadyIssued", { count: alreadyIssued })}`
                  : ""}
              </p>
            )}
            {preview.rows.length === 0 ? (
              <p className="text-xs text-text-secondary">
                {budget ? t("validation.noOwners") : t("validation.noApprovedBudget")}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-text-secondary">
                    <tr>
                      <th className="pb-1 font-medium">{t("owner")}</th>
                      <th className="pb-1 font-medium">{t("units")}</th>
                      <th className="pb-1 text-right font-medium">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {preview.rows.map((row) => (
                      <tr key={row.ownerId}>
                        <td className="py-1 text-text-primary">
                          {ownerNameById.get(row.ownerId) ?? row.ownerId}
                        </td>
                        <td className="py-1 text-text-secondary">
                          {row.unitLabels.join(", ")}
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
              {tModal("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || allIssued || !budget || preview.rows.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? t("issuing") : t("issue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MonthlyQuotaModal;
