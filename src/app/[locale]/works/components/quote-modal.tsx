"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { todayKey } from "@/lib/collections/dates";
import { useOperations, VendorSelectField } from "@/lib/operations";
import DocumentUpload from "@/app/[locale]/operations/components/document-upload";
import type { AddWorksQuoteInput } from "@/lib/works";
import WorksModal, {
  WORKS_FIELD_CLASS,
  WORKS_LABEL_CLASS,
} from "./works-modal";

function QuoteModal({
  projectId,
  condominiumId,
  onClose,
  onSave,
}: {
  projectId: string;
  condominiumId: string;
  onClose: () => void;
  onSave: (input: AddWorksQuoteInput) => Promise<boolean>;
}) {
  const t = useTranslations("works");
  const { vendors } = useOperations();
  const [vendorId, setVendorId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayKey());
  const [validUntil, setValidUntil] = useState("");
  const [document, setDocument] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    const next: Record<string, string> = {};
    if (!vendorId) next.vendorId = t("quote.validation.vendorRequired");
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      next.amount = t("quote.validation.amountRequired");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const ok = await onSave({
      projectId,
      vendorId,
      amount: value,
      description: description.trim(),
      receivedAt,
      validUntil: validUntil || null,
      document,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <WorksModal
      title={t("quote.title")}
      cancelLabel={t("quote.cancel")}
      saveLabel={t("quote.save")}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <VendorSelectField
        vendors={vendors}
        condominiumId={condominiumId}
        value={vendorId}
        onChange={(id) => setVendorId(id)}
        label={t("quote.vendor")}
        emptyOptionLabel={t("quote.emptyVendor")}
        noVendorsMessage={t("quote.noVendors")}
      />
      {errors.vendorId && (
        <p className="-mt-2 text-sm text-error">{errors.vendorId}</p>
      )}
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("quote.amount")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-error">{errors.amount}</p>
        )}
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("quote.description")}</label>
        <textarea
          className={WORKS_FIELD_CLASS}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={WORKS_LABEL_CLASS}>{t("quote.receivedAt")}</label>
          <input
            className={WORKS_FIELD_CLASS}
            type="date"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
          />
        </div>
        <div>
          <label className={WORKS_LABEL_CLASS}>{t("quote.validUntil")}</label>
          <input
            className={WORKS_FIELD_CLASS}
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>
      </div>
      <DocumentUpload
        value={document}
        onChange={setDocument}
        label={t("quote.document")}
      />
    </WorksModal>
  );
}

export default QuoteModal;
