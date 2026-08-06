"use client";

import React, { useState, ChangeEvent, SyntheticEvent } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { OwnerRow } from "./types";

export type OwnerFormSave = {
  fullName: string;
  email: string;
  phone: string;
  unitLabel: string;
  condominiumId: string;
  mailingAddress?: string;
  monthlyQuota?: string;
  taxId?: string;
};

interface Props {
  owner: OwnerRow | null;
  properties: { id: string; name: string }[];
  onClose: () => void;
  onSave: (ownerData: OwnerFormSave) => void;
}

type Errors = {
  [key: string]: string;
};

function OwnerModal({ owner, properties, onClose, onSave }: Props) {
  const t = useTranslations("ownersManagement.modal");
  const { currencySymbol } = useFormatCurrency();
  const [formData, setFormData] = useState(() => ({
    fullName: owner?.owner.fullName || "",
    email: owner?.owner.contacts.email || "",
    phone: owner?.owner.contacts.phone || "",
    unitLabel: owner?.unitLabel || "",
    condominiumId: owner?.condominiumId || "",
    mailingAddress: owner?.owner.contacts.mailingAddress || "",
    monthlyQuota:
      owner?.owner.monthlyQuota != null
        ? String(owner.owner.monthlyQuota)
        : "",
    taxId: owner?.owner.taxId || "",
  }));

  const [errors, setErrors] = useState<Errors>({});

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

    if (!formData.unitLabel.trim()) {
      newErrors.unitLabel = t("validation.unitRequired");
    }

    if (!formData.condominiumId) {
      newErrors.condominiumId = t("validation.propertyRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
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
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("propertyInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("property")}
                </label>
                <Select
                  value={formData.condominiumId}
                  onChange={(e) =>
                    handleChange("condominiumId", e.target.value)
                  }
                  invalid={Boolean(errors.condominiumId)}
                >
                  <option value="">{t("selectProperty")}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </Select>
                {errors.condominiumId && (
                  <p className="mt-1 text-sm text-error">
                    {errors.condominiumId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("unitNumber")}
                </label>
                <input
                  type="text"
                  value={formData.unitLabel}
                  onChange={(e) => handleChange("unitLabel", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.unitLabel ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderUnit")}
                />
                {errors.unitLabel && (
                  <p className="mt-1 text-sm text-error">{errors.unitLabel}</p>
                )}
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
