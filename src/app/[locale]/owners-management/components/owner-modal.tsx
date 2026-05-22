"use client";

import React, { useState, useEffect, ChangeEvent, SyntheticEvent } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { Owner } from "./types";

interface Props {
  owner: Owner | null;
  properties: { id: string; name: string }[];
  onClose: () => void;
  onSave: (ownerData: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    unit: string;
    propertyId: string;
    emergencyContact?: string;
    monthlyFee?: string;
  }) => void;
}

type Errors = {
  [key: string]: string;
};

function OwnerModal({ owner, properties, onClose, onSave }: Props) {
  const t = useTranslations("ownersManagement.modal");
  const { currencySymbol } = useFormatCurrency();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    unit: "",
    propertyId: "",
    emergencyContact: "",
    monthlyFee: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || "",
        email: owner.email || "",
        phone: owner.phone || "",
        unit: owner.unit || "",
        propertyId: owner.propertyId || "",
        emergencyContact: owner.emergencyContact || "",
        monthlyFee: owner.monthlyFee || "",
      });
    }
  }, [owner]);

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("validation.nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("validation.phoneRequired");
    }

    if (!formData.unit.trim()) {
      newErrors.unit = t("validation.unitRequired");
    }

    if (!formData.propertyId) {
      newErrors.propertyId = t("validation.propertyRequired");
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

    // Clear error when user starts typing
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
      className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-1030 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
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
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.name ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderName")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name}</p>
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
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleChange("emergencyContact", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                  placeholder={t("placeholderEmergency")}
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
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
                  value={formData.propertyId}
                  onChange={(e) => handleChange("propertyId", e.target.value)}
                  invalid={Boolean(errors.propertyId)}
                >
                  <option value="">{t("selectProperty")}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </Select>
                {errors.propertyId && (
                  <p className="mt-1 text-sm text-error">{errors.propertyId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("unitNumber")}
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.unit ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("placeholderUnit")}
                />
                {errors.unit && (
                  <p className="mt-1 text-sm text-error">{errors.unit}</p>
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
                    value={formData.monthlyFee}
                    onChange={(e) => handleChange("monthlyFee", e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                    placeholder={t("placeholderFee")}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
