import React, { useState, useEffect, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { Property } from "../types";

type Errors = {
  [key: string]: string;
};

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (propertyData: Property) => void;
  property?: Property; // If editing, the existing property data
}

function PropertyModal({
  isOpen,
  onClose,
  onSave,
  property,
}: PropertyModalProps) {
  const t = useTranslations("propertiesManagement.modal");
  const [formData, setFormData] = useState<Property>({
    id: "",
    name: "",
    address: "",
    totalUnits: 0,
    occupiedUnits: 0,
    monthlyFeeRange: "",
    averageFee: 0,
    collectionRate: 0,
    amenities: [],
    buildingType: "",
    yearBuilt: 0,
    status: "Active",
    lastUpdated: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  const amenityOptions: { key: string; value: string }[] = [
    { key: "swimmingPool", value: "Swimming Pool" },
    { key: "gym", value: "Gym" },
    { key: "parking", value: "Parking" },
    { key: "security", value: "Security" },
    { key: "garden", value: "Garden" },
    { key: "concierge", value: "Concierge" },
    { key: "rooftopTerrace", value: "Rooftop Terrace" },
    { key: "playground", value: "Playground" },
    { key: "lakeAccess", value: "Lake Access" },
    { key: "tennisCourt", value: "Tennis Court" },
    { key: "businessCenter", value: "Business Center" },
    { key: "storage", value: "Storage" },
    { key: "laundry", value: "Laundry" },
  ];

  const buildingTypes = [
    { key: "lowRise", value: "Low-rise" },
    { key: "midRise", value: "Mid-rise" },
    { key: "highRise", value: "High-rise" },
    { key: "townhouse", value: "Townhouse" },
  ];

  const statusOptions = [
    { key: "active", value: "Active" },
    { key: "inactive", value: "Inactive" },
    { key: "underConstruction", value: "Under Construction" },
  ];

  useEffect(() => {
    if (property) {
      setFormData({
        id: "",
        lastUpdated: "",
        name: property.name,
        address: property.address,
        totalUnits: property.totalUnits,
        occupiedUnits: property.occupiedUnits,
        monthlyFeeRange: property.monthlyFeeRange,
        averageFee: property.averageFee,
        collectionRate: property.collectionRate,
        amenities: property.amenities || [],
        buildingType: property.buildingType,
        yearBuilt: property.yearBuilt,
        status: property.status || "Active",
      });
    } else {
      setFormData({
        id: "",
        lastUpdated: "",
        name: "",
        address: "",
        totalUnits: 0,
        occupiedUnits: 0,
        monthlyFeeRange: "",
        averageFee: 0,
        collectionRate: 0,
        amenities: [],
        buildingType: "",
        yearBuilt: 0,
        status: "Active",
      });
    }
    setErrors({});
  }, [property, isOpen]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAmenityToggle = (amenityValue: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityValue)
        ? prev.amenities.filter((a) => a !== amenityValue)
        : [...prev.amenities, amenityValue],
    }));
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) newErrors.name = t("validation.nameRequired");
    if (!formData.address.trim())
      newErrors.address = t("validation.addressRequired");
    if (!formData.totalUnits || formData.totalUnits <= 0)
      newErrors.totalUnits = t("validation.totalUnitsRequired");
    if (!formData.occupiedUnits || formData.occupiedUnits < 0)
      newErrors.occupiedUnits = t("validation.occupiedUnitsNegative");
    if (formData.occupiedUnits > formData.totalUnits) {
      newErrors.occupiedUnits = t("validation.occupiedExceedsTotal");
    }
    if (!formData.monthlyFeeRange.trim())
      newErrors.monthlyFeeRange = t("validation.feeRangeRequired");
    if (!formData.averageFee || formData.averageFee <= 0)
      newErrors.averageFee = t("validation.averageFeeRequired");
    if (
      !formData.collectionRate ||
      formData.collectionRate < 0 ||
      formData.collectionRate > 100
    ) {
      newErrors.collectionRate = t("validation.collectionRateRange");
    }
    if (!formData.buildingType)
      newErrors.buildingType = t("validation.buildingTypeRequired");
    if (
      !formData.yearBuilt ||
      formData.yearBuilt < 1900 ||
      formData.yearBuilt > new Date().getFullYear()
    ) {
      newErrors.yearBuilt = t("validation.yearBuiltInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      const propertyData = {
        ...formData,
        totalUnits: formData.totalUnits,
        occupiedUnits: formData.occupiedUnits,
        averageFee: formData.averageFee,
        collectionRate: formData.collectionRate,
        yearBuilt: formData.yearBuilt,
      };

      onSave(propertyData);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-opacity-100 z-1030 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="p-6 space-y-6">
            {/* Basic Information */}
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
                  <select
                    name="buildingType"
                    value={formData.buildingType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.buildingType
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                  >
                    <option value="">{t("buildingTypePlaceholder")}</option>
                    {buildingTypes.map((type) => (
                      <option key={type.key} value={type.value}>
                        {t(`buildingTypes.${type.key}`)}
                      </option>
                    ))}
                  </select>
                  {errors.buildingType && (
                    <p className="mt-1 text-sm text-error">
                      {errors.buildingType}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("address")} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.address ? "border-error" : "border-border-medium"
                    }`}
                    placeholder={t("addressPlaceholder")}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-error">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("yearBuilt")} *
                  </label>
                  <input
                    type="number"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.yearBuilt ? "border-error" : "border-border-medium"
                    }`}
                    placeholder={t("yearBuiltPlaceholder")}
                  />
                  {errors.yearBuilt && (
                    <p className="mt-1 text-sm text-error">
                      {errors.yearBuilt}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("status")}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.key} value={status.value}>
                        {t(`statuses.${status.key}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Unit Information */}
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
                    name="totalUnits"
                    value={formData.totalUnits}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.totalUnits
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder="e.g., 48"
                  />
                  {errors.totalUnits && (
                    <p className="mt-1 text-sm text-error">
                      {errors.totalUnits}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("occupiedUnits")} *
                  </label>
                  <input
                    type="number"
                    name="occupiedUnits"
                    value={formData.occupiedUnits}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.occupiedUnits
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder="e.g., 45"
                  />
                  {errors.occupiedUnits && (
                    <p className="mt-1 text-sm text-error">
                      {errors.occupiedUnits}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t("financialInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("monthlyFeeRange")} *
                  </label>
                  <input
                    type="text"
                    name="monthlyFeeRange"
                    value={formData.monthlyFeeRange}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.monthlyFeeRange
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder={t("monthlyFeeRangePlaceholder")}
                  />
                  {errors.monthlyFeeRange && (
                    <p className="mt-1 text-sm text-error">
                      {errors.monthlyFeeRange}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("averageFee")} *
                  </label>
                  <input
                    type="number"
                    name="averageFee"
                    value={formData.averageFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.averageFee
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder="e.g., 600"
                  />
                  {errors.averageFee && (
                    <p className="mt-1 text-sm text-error">
                      {errors.averageFee}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("collectionRate")} *
                  </label>
                  <input
                    type="number"
                    name="collectionRate"
                    value={formData.collectionRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                      errors.collectionRate
                        ? "border-error"
                        : "border-border-medium"
                    }`}
                    placeholder="e.g., 94.2"
                  />
                  {errors.collectionRate && (
                    <p className="mt-1 text-sm text-error">
                      {errors.collectionRate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {t("amenities")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenityOptions.map((amenity) => (
                  <label
                    key={amenity.key}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.value)}
                      onChange={() => handleAmenityToggle(amenity.value)}
                      className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm text-text-primary">
                      {t(`amenitiesList.${amenity.key}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
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
