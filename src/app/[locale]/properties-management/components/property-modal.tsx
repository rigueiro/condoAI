"use client";

import React, { useState, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Condominium } from "@/types";
import {
  BUILDING_TYPES,
  CONDOMINIUM_STATUSES,
  COMMON_AREA_LABELS,
  buildEmptyCondominium,
  buildingTypeI18nKey,
  condominiumStatusI18nKey,
} from "@/lib/portfolio";

type Errors = Record<string, string>;

type CondoFormData = {
  name: string;
  street: string;
  postalCode: string;
  parish: string;
  municipality: string;
  taxId: string;
  numberOfUnits: number;
  deedDate: string;
  propertyRegistryNumber: string;
  buildingType: Condominium["buildingType"] | "";
  status: Condominium["status"];
  commonAreas: string[];
};

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condominium: Condominium) => void;
  property?: Condominium;
}

const COMMON_AREA_OPTIONS = Object.keys(COMMON_AREA_LABELS);

function toFormData(condo?: Condominium): CondoFormData {
  return {
    name: condo?.name ?? "",
    street: condo?.address.street ?? "",
    postalCode: condo?.address.postalCode ?? "",
    parish: condo?.address.parish ?? "",
    municipality: condo?.address.municipality ?? "",
    taxId: condo?.taxId ?? "",
    numberOfUnits: condo?.numberOfUnits ?? 0,
    deedDate:
      condo?.deedDate != null
        ? String(condo.deedDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    propertyRegistryNumber: condo?.propertyRegistryNumber ?? "",
    buildingType: condo?.buildingType ?? "",
    status: condo?.status ?? "active",
    commonAreas: condo?.commonAreas ? [...condo.commonAreas] : [],
  };
}

function PropertyModal({
  isOpen,
  onClose,
  onSave,
  property,
}: PropertyModalProps) {
  const t = useTranslations("propertiesManagement.modal");
  const [formData, setFormData] = useState<CondoFormData>(() =>
    toFormData(property),
  );
  const [errors, setErrors] = useState<Errors>({});

  const [syncKey, setSyncKey] = useState({ property, isOpen });
  if (syncKey.property !== property || syncKey.isOpen !== isOpen) {
    setSyncKey({ property, isOpen });
    setFormData(toFormData(property));
    setErrors({});
  }

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      commonAreas: prev.commonAreas.includes(area)
        ? prev.commonAreas.filter((a) => a !== area)
        : [...prev.commonAreas, area],
    }));
  };

  const validateForm = () => {
    const next: Errors = {};
    if (!formData.name.trim()) next.name = t("validation.nameRequired");
    if (!formData.street.trim()) next.street = t("validation.streetRequired");
    if (!formData.municipality.trim())
      next.municipality = t("validation.municipalityRequired");
    if (!formData.taxId.trim()) next.taxId = t("validation.taxIdRequired");
    if (!formData.numberOfUnits || formData.numberOfUnits <= 0)
      next.numberOfUnits = t("validation.totalUnitsRequired");
    if (!formData.buildingType)
      next.buildingType = t("validation.buildingTypeRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    const buildingType = formData.buildingType as Condominium["buildingType"];

    if (property) {
      onSave({
        ...property,
        name: formData.name.trim(),
        address: {
          street: formData.street.trim(),
          postalCode: formData.postalCode.trim(),
          parish: formData.parish.trim(),
          municipality: formData.municipality.trim(),
        },
        taxId: formData.taxId.trim(),
        numberOfUnits: formData.numberOfUnits,
        deedDate: formData.deedDate,
        propertyRegistryNumber: formData.propertyRegistryNumber.trim(),
        commonAreas: formData.commonAreas,
        buildingType,
        status: formData.status,
        internalRegulations: {
          ...property.internalRegulations,
          date: new Date().toISOString().slice(0, 10),
        },
      });
      return;
    }

    onSave(
      buildEmptyCondominium({
        name: formData.name,
        street: formData.street,
        postalCode: formData.postalCode,
        parish: formData.parish,
        municipality: formData.municipality,
        taxId: formData.taxId,
        numberOfUnits: formData.numberOfUnits,
        deedDate: formData.deedDate,
        propertyRegistryNumber: formData.propertyRegistryNumber,
        commonAreas: formData.commonAreas,
        buildingType,
        status: formData.status,
      }),
    );
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-100 z-1030 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">
            {property ? t("editTitle") : t("addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t("basicInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.name ? "border-error" : "border-border-medium"
                    }`}
                    placeholder={t("namePlaceholder")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-error">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("buildingType")} *
                  </label>
                  <Select
                    name="buildingType"
                    value={formData.buildingType}
                    onChange={handleInputChange}
                    invalid={Boolean(errors.buildingType)}
                  >
                    <option value="">{t("buildingTypePlaceholder")}</option>
                    {BUILDING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`buildingTypes.${buildingTypeI18nKey(type)}`)}
                      </option>
                    ))}
                  </Select>
                  {errors.buildingType && (
                    <p className="mt-1 text-sm text-error">
                      {errors.buildingType}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("street")} *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.street ? "border-error" : "border-border-medium"
                    }`}
                    placeholder={t("streetPlaceholder")}
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-error">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("postalCode")}
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
                    placeholder={t("postalCodePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("parish")}
                  </label>
                  <input
                    type="text"
                    name="parish"
                    value={formData.parish}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
                    placeholder={t("parishPlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("municipality")} *
                  </label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.municipality
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder={t("municipalityPlaceholder")}
                  />
                  {errors.municipality && (
                    <p className="mt-1 text-sm text-error">
                      {errors.municipality}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("taxId")} *
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.taxId ? "border-error" : "border-border-medium"
                    }`}
                    placeholder={t("taxIdPlaceholder")}
                  />
                  {errors.taxId && (
                    <p className="mt-1 text-sm text-error">{errors.taxId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("deedDate")}
                  </label>
                  <input
                    type="date"
                    name="deedDate"
                    value={formData.deedDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("status")}
                  </label>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {CONDOMINIUM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`statuses.${condominiumStatusI18nKey(status)}`)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("propertyRegistryNumber")}
                  </label>
                  <input
                    type="text"
                    name="propertyRegistryNumber"
                    value={formData.propertyRegistryNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
                    placeholder={t("propertyRegistryPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t("unitInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("totalUnits")} *
                  </label>
                  <input
                    type="number"
                    name="numberOfUnits"
                    value={formData.numberOfUnits || ""}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.numberOfUnits
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder="e.g., 48"
                  />
                  {errors.numberOfUnits && (
                    <p className="mt-1 text-sm text-error">
                      {errors.numberOfUnits}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t("amenities")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {COMMON_AREA_OPTIONS.map((area) => (
                  <label
                    key={area}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.commonAreas.includes(area)}
                      onChange={() => handleAreaToggle(area)}
                      className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm text-text-primary">
                      {t(`commonAreasList.${area}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-border-light bg-secondary-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-text-secondary hover:text-text-primary hover:bg-secondary-100 rounded-lg transition-smooth"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth"
            >
              {property ? t("edit") : t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyModal;
