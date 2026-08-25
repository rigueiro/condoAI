"use client";

import React, { useMemo, useState, ChangeEvent, SyntheticEvent } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { OccupancyRole, Unit } from "@/types";
import { OCCUPANCY_ROLES, type OccupancyLink } from "@/lib/portfolio";
import type { OwnerRow } from "./types";

export type OwnerFormSave = {
  fullName: string;
  email: string;
  phone: string;
  mailingAddress?: string;
  monthlyQuota?: string;
  taxId?: string;
  occupancies: OccupancyLink[];
};

interface Props {
  owner: OwnerRow | null;
  properties: { id: string; name: string }[];
  units: Unit[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onSave: (ownerData: OwnerFormSave) => void;
}

type OccupancyRow = {
  key: string;
  condominiumId: string;
  unitId: string;
  role: OccupancyRole;
};

type Errors = {
  [key: string]: string;
};

function newOccupancyRow(
  condominiumId = "",
  unitId = "",
  role: OccupancyRole = "owner",
): OccupancyRow {
  return {
    key: crypto.randomUUID(),
    condominiumId,
    unitId,
    role,
  };
}

function OwnerModal({
  owner,
  properties,
  units,
  defaultCondominiumId = "",
  onClose,
  onSave,
}: Props) {
  const t = useTranslations("ownersManagement.modal");
  const tRole = useTranslations("ownersManagement.roles");
  const { currencySymbol } = useFormatCurrency();
  const [formData, setFormData] = useState(() => ({
    fullName: owner?.owner.fullName || "",
    email: owner?.owner.contacts.email || "",
    phone: owner?.owner.contacts.phone || "",
    mailingAddress: owner?.owner.contacts.mailingAddress || "",
    monthlyQuota:
      owner?.owner.monthlyQuota != null
        ? String(owner.owner.monthlyQuota)
        : "",
    taxId: owner?.owner.taxId || "",
  }));
  const [occupancies, setOccupancies] = useState<OccupancyRow[]>(() =>
    owner?.occupancies.length
      ? owner.occupancies.map((item) =>
          newOccupancyRow(item.condominiumId, item.unitId, item.role),
        )
      : [newOccupancyRow(defaultCondominiumId)],
  );

  const [errors, setErrors] = useState<Errors>({});

  const unitsByCondoId = useMemo(() => {
    const map = new Map<string, Unit[]>();
    for (const unit of units) {
      const list = map.get(unit.condominiumId) ?? [];
      list.push(unit);
      map.set(unit.condominiumId, list);
    }
    return map;
  }, [units]);

  const selectedUnitIds = useMemo(
    () => new Set(occupancies.map((row) => row.unitId).filter(Boolean)),
    [occupancies],
  );

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("validation.nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("validation.phoneRequired");
    }

    const filled = occupancies.filter((row) => row.unitId);
    if (filled.length === 0) {
      newErrors.occupancies = t("validation.occupancyRequired");
    }

    occupancies.forEach((row, index) => {
      if (!row.condominiumId && !row.unitId) return;
      if (!row.condominiumId) {
        newErrors[`occupancy-${index}-property`] = t(
          "validation.propertyRequired",
        );
      }
      if (!row.unitId) {
        const condoUnits = unitsByCondoId.get(row.condominiumId) ?? [];
        newErrors[`occupancy-${index}-unit`] =
          row.condominiumId && condoUnits.length === 0
            ? t("validation.registerFractionsFirst")
            : t("validation.unitRequired");
      }
    });

    const seen = new Set<string>();
    for (const row of filled) {
      if (seen.has(row.unitId)) {
        newErrors.occupancies = t("validation.duplicateUnit");
        break;
      }
      seen.add(row.unitId);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        occupancies: occupancies
          .filter((row) => row.unitId)
          .map((row) => ({
            unitId: row.unitId,
            role: row.role,
          })),
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleOccupancyChange = (
    index: number,
    field: keyof OccupancyRow,
    value: string,
  ) => {
    setOccupancies((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "condominiumId") {
          return { ...row, condominiumId: value, unitId: "" };
        }
        if (field === "role") {
          return { ...row, role: value as OccupancyRole };
        }
        return { ...row, [field]: value };
      }),
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next.occupancies;
      delete next[`occupancy-${index}-property`];
      delete next[`occupancy-${index}-unit`];
      return next;
    });
  };

  const addOccupancy = () => {
    setOccupancies((prev) => [...prev, newOccupancyRow()]);
  };

  const removeOccupancy = (index: number) => {
    setOccupancies((prev) =>
      prev.length <= 1 ? [newOccupancyRow()] : prev.filter((_, i) => i !== index),
    );
  };

  const handleBackdropClick = (e: SyntheticEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-1030 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">
            {owner ? t("editTitle") : t("addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("fullName")}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.fullName ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderName")}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-error">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.email ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderEmail")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.phone ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderPhone")}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("emergencyContact")}
                </label>
                <input
                  type="text"
                  value={formData.mailingAddress}
                  onChange={(e) =>
                    handleChange("mailingAddress", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                  placeholder={t("placeholderEmergency")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("taxId")}
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                  placeholder={t("placeholderTaxId")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("monthlyFee")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={formData.monthlyQuota}
                    onChange={(e) =>
                      handleChange("monthlyQuota", e.target.value)
                    }
                    className="w-full pl-8 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                    placeholder={t("placeholderFee")}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">
                {t("occupancyInfo")}
              </h3>
              <button
                type="button"
                onClick={addOccupancy}
                className="inline-flex items-center space-x-1 text-sm font-medium text-primary hover:text-primary-700 transition-smooth"
              >
                <Icon name="Plus" size={16} />
                <span>{t("addFraction")}</span>
              </button>
            </div>
            {errors.occupancies && (
              <p className="mb-3 text-sm text-error">{errors.occupancies}</p>
            )}
            <div className="space-y-4">
              {occupancies.map((row, index) => {
                const condoUnits = unitsByCondoId.get(row.condominiumId) ?? [];
                return (
                  <div
                    key={row.key}
                    className="rounded-lg border border-border-light p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">
                        {t("fractionRow", { index: index + 1 })}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeOccupancy(index)}
                        className="p-1 text-text-secondary hover:text-error transition-smooth"
                        title={t("removeFraction")}
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t("property")}
                        </label>
                        <Select
                          value={row.condominiumId}
                          onChange={(e) =>
                            handleOccupancyChange(
                              index,
                              "condominiumId",
                              e.target.value,
                            )
                          }
                          invalid={Boolean(
                            errors[`occupancy-${index}-property`],
                          )}
                        >
                          <option value="">{t("selectProperty")}</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.name}
                            </option>
                          ))}
                        </Select>
                        {errors[`occupancy-${index}-property`] && (
                          <p className="mt-1 text-sm text-error">
                            {errors[`occupancy-${index}-property`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t("unitNumber")}
                        </label>
                        <Select
                          value={row.unitId}
                          onChange={(e) =>
                            handleOccupancyChange(
                              index,
                              "unitId",
                              e.target.value,
                            )
                          }
                          invalid={Boolean(errors[`occupancy-${index}-unit`])}
                          disabled={!row.condominiumId}
                        >
                          <option value="">{t("selectUnit")}</option>
                          {condoUnits.map((unit) => (
                            <option
                              key={unit.id}
                              value={unit.id}
                              disabled={
                                selectedUnitIds.has(unit.id) &&
                                unit.id !== row.unitId
                              }
                            >
                              {unit.label}
                            </option>
                          ))}
                        </Select>
                        {errors[`occupancy-${index}-unit`] && (
                          <p className="mt-1 text-sm text-error">
                            {errors[`occupancy-${index}-unit`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t("role")}
                        </label>
                        <Select
                          value={row.role}
                          onChange={(e) =>
                            handleOccupancyChange(index, "role", e.target.value)
                          }
                        >
                          {OCCUPANCY_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {tRole(role)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
            >
              <Icon name="Save" size={16} />
              <span>{owner ? t("updateOwner") : t("addOwner")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OwnerModal;
