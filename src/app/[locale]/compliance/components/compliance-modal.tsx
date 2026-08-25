"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Certificate, InsurancePolicy } from "@/types";
import type { ComplianceKind } from "@/lib/compliance";
import DocumentUpload from "./document-upload";

export type ComplianceRecord =
  | { kind: "insurance"; data: InsurancePolicy }
  | { kind: "certificate"; data: Certificate };

type CondoOption = { id: string; name: string };

type Errors = Record<string, string>;

function ComplianceModal({
  record,
  defaultKind,
  condominiums,
  defaultCondominiumId,
  onClose,
  onSave,
}: {
  record: ComplianceRecord | null;
  defaultKind: ComplianceKind;
  condominiums: CondoOption[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onSave: (record: ComplianceRecord) => void;
}) {
  const t = useTranslations("compliance");
  const isEdit = Boolean(record);
  const [kind, setKind] = useState<ComplianceKind>(
    record?.kind ?? defaultKind,
  );
  const [condominiumId, setCondominiumId] = useState(
    record?.data.condominiumId ??
      defaultCondominiumId ??
      condominiums[0]?.id ??
      "",
  );
  const [insurer, setInsurer] = useState(
    record?.kind === "insurance" ? record.data.insurer : "",
  );
  const [policyNumber, setPolicyNumber] = useState(
    record?.kind === "insurance" ? record.data.number : "",
  );
  const [coverages, setCoverages] = useState(
    record?.kind === "insurance" ? record.data.coverages.join(", ") : "",
  );
  const [insuredCapital, setInsuredCapital] = useState(
    record?.kind === "insurance" ? String(record.data.insuredCapital) : "",
  );
  const [annualPremium, setAnnualPremium] = useState(
    record?.kind === "insurance" ? String(record.data.annualPremium) : "",
  );
  const [renewalDate, setRenewalDate] = useState(
    record?.kind === "insurance"
      ? String(record.data.renewalDate).slice(0, 10)
      : "",
  );
  const [certificateType, setCertificateType] = useState<
    Certificate["type"]
  >(record?.kind === "certificate" ? record.data.type : "energy");
  const [validity, setValidity] = useState(
    record?.kind === "certificate"
      ? String(record.data.validity).slice(0, 10)
      : "",
  );
  const [documentFile, setDocumentFile] = useState<string | null>(
    record?.kind === "certificate" ? record.data.file : null,
  );
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const next: Errors = {};
    if (!condominiumId) next.condominiumId = t("modal.validation.condominiumRequired");

    if (kind === "insurance") {
      if (!insurer.trim()) next.insurer = t("modal.validation.insurerRequired");
      if (!policyNumber.trim())
        next.policyNumber = t("modal.validation.policyRequired");
      if (!renewalDate) next.renewalDate = t("modal.validation.renewalRequired");
    } else if (kind === "certificate") {
      if (!validity) next.validity = t("modal.validation.validityRequired");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = record?.data.id ?? crypto.randomUUID();

    if (kind === "insurance") {
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          insurer: insurer.trim(),
          number: policyNumber.trim(),
          coverages: coverages
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          insuredCapital: Number(insuredCapital) || 0,
          annualPremium: Number(annualPremium) || 0,
          renewalDate,
        },
      });
      return;
    }

    if (kind === "certificate") {
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          type: certificateType,
          validity,
          file: documentFile,
        },
      });
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
        aria-label={t("modal.cancel")}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit
              ? t("modal.editTitle", { kind: t(`kinds.${kind}`) })
              : t("modal.addTitle", { kind: t(`kinds.${kind}`) })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {!isEdit && (
            <div>
              <label className={labelClass}>{t("modal.kind")}</label>
              <Select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as ComplianceKind);
                  setDocumentFile(null);
                }}
              >
                <option value="insurance">{t("kinds.insurance")}</option>
                <option value="certificate">{t("kinds.certificate")}</option>
              </Select>
            </div>
          )}

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

          {kind === "insurance" && (
            <>
              <div>
                <label className={labelClass}>{t("modal.insurer")}</label>
                <input
                  className={fieldClass}
                  value={insurer}
                  onChange={(e) => setInsurer(e.target.value)}
                />
                {errors.insurer && (
                  <p className="mt-1 text-xs text-error">{errors.insurer}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.policyNumber")}</label>
                <input
                  className={fieldClass}
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                />
                {errors.policyNumber && (
                  <p className="mt-1 text-xs text-error">{errors.policyNumber}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.coverages")}</label>
                <input
                  className={fieldClass}
                  value={coverages}
                  onChange={(e) => setCoverages(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    {t("modal.insuredCapital")}
                  </label>
                  <input
                    type="number"
                    className={fieldClass}
                    value={insuredCapital}
                    onChange={(e) => setInsuredCapital(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("modal.annualPremium")}
                  </label>
                  <input
                    type="number"
                    className={fieldClass}
                    value={annualPremium}
                    onChange={(e) => setAnnualPremium(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("modal.renewalDate")}</label>
                <input
                  type="date"
                  className={fieldClass}
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
                {errors.renewalDate && (
                  <p className="mt-1 text-xs text-error">{errors.renewalDate}</p>
                )}
              </div>
            </>
          )}

          {kind === "certificate" && (
            <>
              <div>
                <label className={labelClass}>
                  {t("modal.certificateType")}
                </label>
                <Select
                  value={certificateType}
                  onChange={(e) =>
                    setCertificateType(e.target.value as Certificate["type"])
                  }
                >
                  <option value="energy">
                    {t("certificateTypes.energy")}
                  </option>
                  <option value="technical-inspection">
                    {t("certificateTypes.technical-inspection")}
                  </option>
                  <option value="usage-license">
                    {t("certificateTypes.usage-license")}
                  </option>
                </Select>
              </div>
              <div>
                <label className={labelClass}>{t("modal.validity")}</label>
                <input
                  type="date"
                  className={fieldClass}
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                />
                {errors.validity && (
                  <p className="mt-1 text-xs text-error">{errors.validity}</p>
                )}
              </div>
              <DocumentUpload
                label={t("modal.file.document")}
                value={documentFile}
                onChange={setDocumentFile}
              />
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("modal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComplianceModal;
