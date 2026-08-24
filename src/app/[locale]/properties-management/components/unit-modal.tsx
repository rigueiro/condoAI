"use client";

import React, {
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Unit } from "@/types";
import {
  UNIT_TYPES,
  buildEmptyUnit,
  formatPermillage,
  parseDecimal,
  roundPermillage,
} from "@/lib/portfolio";

type Errors = Record<string, string>;

type UnitFormData = {
  label: string;
  floor: string;
  type: Unit["type"];
  permillage: string;
  areaSqm: string;
};

interface UnitModalProps {
  isOpen: boolean;
  unit: Unit | null;
  condominiumId: string;
  remainingPermillage: number;
  totalPermillage: number;
  onClose: () => void;
  onSave: (unit: Unit) => Promise<void>;
}

function toFormData(unit: Unit | null): UnitFormData {
  return {
    label: unit?.label ?? "",
    floor: unit?.floor ?? "",
    type: unit?.type ?? "apartment",
    permillage:
      unit && unit.permillage > 0 ? String(unit.permillage) : "",
    areaSqm: unit?.areaSqm != null ? String(unit.areaSqm) : "",
  };
}

const SAVE_ERROR_CODES = [
  "duplicateLabel",
  "permillageExceedsTotal",
  "invalidPermillage",
  "labelRequired",
  "invalidType",
  "condominiumNotFound",
  "unitHasOwners",
  "unitNotFound",
] as const;

type SaveErrorCode = (typeof SAVE_ERROR_CODES)[number];

function isSaveErrorCode(code: string): code is SaveErrorCode {
  return (SAVE_ERROR_CODES as readonly string[]).includes(code);
}

function messageForError(
  t: ReturnType<typeof useTranslations<"propertiesManagement.unitModal">>,
  code: string,
): string {
  return isSaveErrorCode(code)
    ? t(`errors.${code}`)
    : t("errors.requestFailed");
}

function UnitModal({
  isOpen,
  unit,
  condominiumId,
  remainingPermillage,
  totalPermillage,
  onClose,
  onSave,
}: UnitModalProps) {
  const t = useTranslations("propertiesManagement.unitModal");
  const tTypes = useTranslations("propertiesManagement.units.types");
  const [formData, setFormData] = useState<UnitFormData>(() =>
    toFormData(unit),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [syncKey, setSyncKey] = useState({ unit, isOpen });
  if (syncKey.unit !== unit || syncKey.isOpen !== isOpen) {
    setSyncKey({ unit, isOpen });
    setFormData(toFormData(unit));
    setErrors({});
    setSubmitError(null);
    setSaving(false);
  }

  if (!isOpen) return null;

  const maxPermillage = Math.max(
    0,
    roundPermillage(remainingPermillage + (unit?.permillage ?? 0)),
  );

  const validate = (): boolean => {
    const next: Errors = {};
    if (!formData.label.trim()) {
      next.label = t("validation.labelRequired");
    }
    const permillage = parseDecimal(formData.permillage);
    if (!Number.isFinite(permillage) || permillage <= 0) {
      next.permillage = t("validation.permillageRequired");
    } else if (permillage > maxPermillage + 0.0005) {
      next.permillage = t("validation.permillageExceeds", {
        remaining: formatPermillage(maxPermillage),
      });
    }
    if (formData.areaSqm.trim()) {
      const area = parseDecimal(formData.areaSqm);
      if (!Number.isFinite(area) || area < 0) {
        next.areaSqm = t("validation.areaInvalid");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const permillage = roundPermillage(parseDecimal(formData.permillage));
    const areaRaw = formData.areaSqm.trim();
    const nextUnit: Unit = {
      ...(unit ?? buildEmptyUnit(condominiumId)),
      label: formData.label.trim(),
      floor: formData.floor.trim() || null,
      type: formData.type,
      permillage,
      areaSqm: areaRaw ? parseDecimal(areaRaw) : null,
    };

    setSaving(true);
    setSubmitError(null);
    try {
      await onSave(nextUnit);
    } catch (err) {
      const code = err instanceof Error ? err.message : "requestFailed";
      setSubmitError(messageForError(t, code));
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UnitFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (submitError) setSubmitError(null);
  };

  const handleBackdropClick = (e: SyntheticEvent) => {
    if (e.target === e.currentTarget && !saving) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-1030 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">
            {unit ? t("editTitle") : t("addTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-text-secondary">
            {t("remainingHint", {
              remaining: formatPermillage(maxPermillage),
              total: formatPermillage(totalPermillage),
            })}
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t("label")}
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => handleChange("label", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                errors.label ? "border-error" : "border-border-light"
              }`}
              placeholder={t("labelPlaceholder")}
              autoFocus
            />
            {errors.label && (
              <p className="mt-1 text-sm text-error">{errors.label}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("type")}
              </label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  handleChange("type", e.target.value as Unit["type"])
                }
              >
                {UNIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tTypes(type)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("floor")}
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => handleChange("floor", e.target.value)}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                placeholder={t("floorPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("permillage")}
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0.001"
                max={maxPermillage > 0 ? maxPermillage : undefined}
                step="0.001"
                value={formData.permillage}
                onChange={(e) => handleChange("permillage", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                  errors.permillage ? "border-error" : "border-border-light"
                }`}
                placeholder={t("permillagePlaceholder")}
              />
              {errors.permillage && (
                <p className="mt-1 text-sm text-error">{errors.permillage}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("area")}
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={formData.areaSqm}
                onChange={(e) => handleChange("areaSqm", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                  errors.areaSqm ? "border-error" : "border-border-light"
                }`}
                placeholder={t("areaPlaceholder")}
              />
              {errors.areaSqm && (
                <p className="mt-1 text-sm text-error">{errors.areaSqm}</p>
              )}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-error">{submitError}</p>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-smooth disabled:opacity-60"
            >
              <Icon name="Save" size={16} />
              <span>{saving ? t("saving") : unit ? t("update") : t("add")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnitModal;
