"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  SyntheticEvent,
  JSX,
} from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import type { Occurrence } from "../types";

type Errors = {
  [key: string]: string;
};

interface Props {
  occurrence?: Occurrence;
  onClose: () => void;
  onSave: (occurrence: Occurrence) => void;
}

function NewOccurrenceModal({
  occurrence,
  onClose,
  onSave,
}: Props): JSX.Element {
  const t = useTranslations("occurrences.modal");
  const [formData, setFormData] = useState<any>({
    id: "",
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (occurrence) {
      setFormData({
        id: occurrence.id || "",
        name: occurrence.name || "",
        description: occurrence.description || "",
      });
    }
  }, [occurrence]);

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("validation.titleRequired");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("validation.descriptionRequired");
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
    setFormData((prev: any) => ({
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1030 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">
            {occurrence ? t("editTitle") : t("addTitle")}
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
          {/* {t("personalInfo")} */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("title")} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.name ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("titlePlaceholder")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("description")} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
                    errors.email ? "border-error" : "border-border-light"
                  }`}
                  placeholder={t("descriptionPlaceholder")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("description")}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                  placeholder={t("descriptionPlaceholder")}
                />
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
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
            >
              <Icon name="Save" size={16} />
              <span>{occurrence ? t("update") : t("save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewOccurrenceModal;
