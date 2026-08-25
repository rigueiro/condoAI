"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Equipment, MaintenanceContract, Vendor } from "@/types";
import type { OperationsKind } from "@/lib/operations";
import DocumentUpload from "./document-upload";

export type OperationsRecord =
  | { kind: "vendor"; data: Vendor }
  | { kind: "contract"; data: MaintenanceContract }
  | { kind: "equipment"; data: Equipment };

type CondoOption = { id: string; name: string };

type Errors = Record<string, string>;

function OperationsModal({
  record,
  defaultKind,
  condominiums,
  vendors,
  defaultCondominiumId,
  onClose,
  onSave,
}: {
  record: OperationsRecord | null;
  defaultKind: OperationsKind;
  condominiums: CondoOption[];
  vendors: Vendor[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onSave: (record: OperationsRecord) => void;
}) {
  const t = useTranslations("operations");
  const isEdit = Boolean(record);
  const [kind, setKind] = useState<OperationsKind>(
    record?.kind ?? defaultKind,
  );
  const [condominiumId, setCondominiumId] = useState(
    record?.data.condominiumId ??
      defaultCondominiumId ??
      condominiums[0]?.id ??
      "",
  );

  const [name, setName] = useState(
    record?.kind === "vendor" ? record.data.name : "",
  );
  const [nif, setNif] = useState(
    record?.kind === "vendor" ? record.data.nif : "",
  );
  const [email, setEmail] = useState(
    record?.kind === "vendor" ? record.data.email : "",
  );
  const [phone, setPhone] = useState(
    record?.kind === "vendor" ? record.data.phone : "",
  );
  const [services, setServices] = useState(
    record?.kind === "vendor" ? record.data.services : "",
  );
  const [notes, setNotes] = useState(
    record?.kind === "vendor" ? record.data.notes : "",
  );

  const [vendorId, setVendorId] = useState(
    record?.kind === "contract" ? record.data.vendorId : "",
  );
  const [service, setService] = useState(
    record?.kind === "contract" ? record.data.service : "",
  );
  const [monthlyValue, setMonthlyValue] = useState(
    record?.kind === "contract" ? String(record.data.monthlyValue) : "",
  );
  const [startDate, setStartDate] = useState(
    record?.kind === "contract"
      ? String(record.data.startDate).slice(0, 10)
      : "",
  );
  const [endDate, setEndDate] = useState(
    record?.kind === "contract" && record.data.endDate
      ? String(record.data.endDate).slice(0, 10)
      : "",
  );
  const [documentFile, setDocumentFile] = useState<string | null>(
    record?.kind === "contract" ? record.data.document : null,
  );

  const [equipType, setEquipType] = useState(
    record?.kind === "equipment" ? record.data.type : "",
  );
  const [brand, setBrand] = useState(
    record?.kind === "equipment" ? record.data.brand : "",
  );
  const [installationDate, setInstallationDate] = useState(
    record?.kind === "equipment"
      ? String(record.data.installationDate).slice(0, 10)
      : "",
  );
  const [location, setLocation] = useState(
    record?.kind === "equipment" ? record.data.location : "",
  );
  const [status, setStatus] = useState<Equipment["status"]>(
    record?.kind === "equipment" ? record.data.status : "operational",
  );

  const [errors, setErrors] = useState<Errors>({});

  const condoVendors = useMemo(
    () => vendors.filter((v) => v.condominiumId === condominiumId),
    [vendors, condominiumId],
  );

  const validate = (): boolean => {
    const next: Errors = {};
    if (!condominiumId) {
      next.condominiumId = t("modal.validation.condominiumRequired");
    }

    if (kind === "vendor") {
      if (!name.trim()) next.name = t("modal.validation.nameRequired");
    } else if (kind === "contract") {
      if (!vendorId) next.vendorId = t("modal.validation.vendorRequired");
      if (!service.trim()) next.service = t("modal.validation.serviceRequired");
      if (!startDate) next.startDate = t("modal.validation.startRequired");
    } else if (kind === "equipment") {
      if (!equipType.trim()) next.type = t("modal.validation.typeRequired");
      if (!brand.trim()) next.brand = t("modal.validation.brandRequired");
      if (!installationDate) {
        next.installationDate = t("modal.validation.installedRequired");
      }
      if (!location.trim()) {
        next.location = t("modal.validation.locationRequired");
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = record?.data.id ?? crypto.randomUUID();

    if (kind === "vendor") {
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          name: name.trim(),
          nif: nif.trim(),
          email: email.trim(),
          phone: phone.trim(),
          services: services.trim(),
          notes: notes.trim(),
        },
      });
      return;
    }

    if (kind === "contract") {
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          vendorId,
          service: service.trim(),
          monthlyValue: Number(monthlyValue) || 0,
          startDate,
          endDate: endDate || null,
          document: documentFile,
        },
      });
      return;
    }

    onSave({
      kind: "equipment",
      data: {
        id,
        condominiumId,
        type: equipType.trim(),
        brand: brand.trim(),
        installationDate,
        location: location.trim(),
        status,
      },
    });
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
                  setKind(e.target.value as OperationsKind);
                  setDocumentFile(null);
                  setVendorId("");
                }}
              >
                <option value="vendor">{t("kinds.vendor")}</option>
                <option value="contract">{t("kinds.contract")}</option>
                <option value="equipment">{t("kinds.equipment")}</option>
              </Select>
            </div>
          )}

          <div>
            <label className={labelClass}>{t("modal.condominium")}</label>
            <Select
              value={condominiumId}
              onChange={(e) => {
                setCondominiumId(e.target.value);
                setVendorId("");
              }}
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

          {kind === "vendor" && (
            <>
              <div>
                <label className={labelClass}>{t("modal.name")}</label>
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-error">{errors.name}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.nif")}</label>
                <input
                  className={fieldClass}
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("modal.email")}</label>
                  <input
                    type="email"
                    className={fieldClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("modal.phone")}</label>
                  <input
                    className={fieldClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("modal.services")}</label>
                <input
                  className={fieldClass}
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("modal.notes")}</label>
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {kind === "contract" && (
            <>
              <div>
                <label className={labelClass}>{t("modal.vendor")}</label>
                {condoVendors.length === 0 ? (
                  <p className="text-xs text-text-secondary">
                    {t("modal.noVendors")}
                  </p>
                ) : (
                  <Select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                  >
                    <option value="">—</option>
                    {condoVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </Select>
                )}
                {errors.vendorId && (
                  <p className="mt-1 text-xs text-error">{errors.vendorId}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.service")}</label>
                <input
                  className={fieldClass}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
                {errors.service && (
                  <p className="mt-1 text-xs text-error">{errors.service}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.monthlyValue")}</label>
                <input
                  type="number"
                  className={fieldClass}
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("modal.startDate")}</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-xs text-error">{errors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{t("modal.endDate")}</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    {t("modal.endDateHint")}
                  </p>
                </div>
              </div>
              <DocumentUpload
                label={t("modal.file.document")}
                value={documentFile}
                onChange={setDocumentFile}
              />
            </>
          )}

          {kind === "equipment" && (
            <>
              <div>
                <label className={labelClass}>{t("modal.type")}</label>
                <input
                  className={fieldClass}
                  value={equipType}
                  onChange={(e) => setEquipType(e.target.value)}
                  placeholder="elevator, water-pump…"
                />
                {errors.type && (
                  <p className="mt-1 text-xs text-error">{errors.type}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.brand")}</label>
                <input
                  className={fieldClass}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
                {errors.brand && (
                  <p className="mt-1 text-xs text-error">{errors.brand}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  {t("modal.installationDate")}
                </label>
                <input
                  type="date"
                  className={fieldClass}
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                />
                {errors.installationDate && (
                  <p className="mt-1 text-xs text-error">
                    {errors.installationDate}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.location")}</label>
                <input
                  className={fieldClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-error">{errors.location}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.status")}</label>
                <Select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Equipment["status"])
                  }
                >
                  <option value="operational">
                    {t("status.operational")}
                  </option>
                  <option value="maintenance">
                    {t("status.maintenance")}
                  </option>
                  <option value="broken">{t("status.broken")}</option>
                </Select>
              </div>
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

export default OperationsModal;
