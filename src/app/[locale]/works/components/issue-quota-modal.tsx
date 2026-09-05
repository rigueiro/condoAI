"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { todayKey } from "@/lib/collections/dates";
import {
  allocateExtraordinary,
  ownerCountFromAllocations,
} from "@/lib/finance";
import type { IssueWorksQuotaInput, WorksProject } from "@/lib/works";
import { awardedQuote } from "@/lib/works";
import type { Owner, Unit } from "@/types";
import WorksModal, {
  WORKS_FIELD_CLASS,
  WORKS_LABEL_CLASS,
} from "./works-modal";

function IssueQuotaModal({
  project,
  units,
  owners,
  onClose,
  onSave,
}: {
  project: WorksProject;
  units: Unit[];
  owners: Owner[];
  onClose: () => void;
  onSave: (input: IssueWorksQuotaInput) => Promise<boolean>;
}) {
  const t = useTranslations("works");
  const { formatCurrency } = useFormatCurrency();
  const quoted = awardedQuote(project)?.amount ?? 0;
  const [description, setDescription] = useState(project.title);
  const [totalAmount, setTotalAmount] = useState(quoted ? String(quoted) : "");
  const [date, setDate] = useState(todayKey());
  const [dueDate, setDueDate] = useState(todayKey());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const ownerIds = useMemo(() => new Set(owners.map((owner) => owner.id)), [owners]);
  const ownerNameById = useMemo(
    () => new Map(owners.map((owner) => [owner.id, owner.fullName])),
    [owners],
  );
  const amount = Number(totalAmount);
  const allocations = useMemo(() => {
    if (!Number.isFinite(amount) || amount <= 0) return [];
    return allocateExtraordinary(units, project.condominiumId, amount, ownerIds);
  }, [amount, ownerIds, project.condominiumId, units]);
  const billedOwners = ownerCountFromAllocations(allocations);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!totalAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      next.totalAmount = t("quota.validation.amountRequired");
    }
    if (Object.keys(next).length === 0 && allocations.length === 0) {
      next.totalAmount = t("quota.validation.noOwners");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const ok = await onSave({
      projectId: project.id,
      description: description.trim() || project.title,
      totalAmount: amount,
      date,
      dueDate,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <WorksModal
      title={t("quota.issue")}
      cancelLabel={t("quota.cancel")}
      saveLabel={saving ? t("quota.issuing") : t("quota.save")}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("quota.description")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("quota.total")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          type="number"
          min="0"
          step="0.01"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
        {errors.totalAmount && (
          <p className="mt-1 text-sm text-error">{errors.totalAmount}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={WORKS_LABEL_CLASS}>{t("quota.date")}</label>
          <input
            className={WORKS_FIELD_CLASS}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className={WORKS_LABEL_CLASS}>{t("quota.dueDate")}</label>
          <input
            className={WORKS_FIELD_CLASS}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{t("quota.preview")}</p>
        <p className="mb-2 text-xs text-text-secondary">
          {allocations.length > 0
            ? t("quota.billedOwners", { count: billedOwners })
            : t("quota.previewEmpty")}
        </p>
        {allocations.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border-light">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-left text-xs text-text-secondary">
                <tr>
                  <th className="px-3 py-2">{t("quota.unit")}</th>
                  <th className="px-3 py-2">{t("quota.owner")}</th>
                  <th className="px-3 py-2 text-right">{t("quota.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((row) => (
                  <tr
                    key={`${row.unitId}-${row.ownerId}`}
                    className="border-t border-border-light"
                  >
                    <td className="px-3 py-1.5">{row.unitLabel}</td>
                    <td className="px-3 py-1.5 text-text-secondary">
                      {ownerNameById.get(row.ownerId) ?? row.ownerId}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorksModal>
  );
}

export default IssueQuotaModal;
