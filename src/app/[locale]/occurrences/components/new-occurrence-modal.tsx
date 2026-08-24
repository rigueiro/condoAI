"use client";

import React, { useMemo, useState, ChangeEvent, SyntheticEvent, JSX } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Condominium, Owner, Unit } from "@/types";
import { indexOccupanciesByOwnerId } from "@/lib/portfolio/occupancy";
import {
  formatOccurrenceDate,
  type Occurrence,
  type OccurrenceCategoryValue,
  type OccurrencePriorityValue,
  type OccurrenceStateKey,
} from "../types";
import {
  OCCURRENCE_CATEGORY_VALUES,
  OCCURRENCE_PRIORITY_VALUES,
  OCCURRENCE_STATE_KEYS,
} from "./occurrence-meta";

type Errors = {
  [key: string]: string;
};

interface FormState {
  title: string;
  description: string;
  category: OccurrenceCategoryValue;
  condominiumId: string;
  ownerId: string;
  unit: string;
  assignedTo: string;
  priority: OccurrencePriorityValue;
  status: OccurrenceStateKey;
}

interface Props {
  occurrence?: Occurrence | null;
  condominiums: Pick<Condominium, "id" | "name">[];
  owners: Owner[];
  units?: Unit[];
  onClose: () => void;
  onSave: (occurrence: Occurrence) => void;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  category: "MAINTENANCE",
  condominiumId: "",
  ownerId: "",
  unit: "",
  assignedTo: "",
  priority: "MEDIUM",
  status: "Open",
};

function NewOccurrenceModal({
  occurrence,
  condominiums,
  owners,
  units = [],
  onClose,
  onSave,
}: Props): JSX.Element {
  const t = useTranslations("occurrences.modal");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");

  const linksByOwner = useMemo(
    () => indexOccupanciesByOwnerId(units),
    [units],
  );

  const [formData, setFormData] = useState<FormState>(() =>
    occurrence
      ? {
          title: occurrence.title || "",
          description: occurrence.description || "",
          category: occurrence.category || "MAINTENANCE",
          condominiumId: occurrence.condominiumId || "",
          ownerId: occurrence.ownerId || "",
          unit: occurrence.unit || "",
          assignedTo: occurrence.assignedTo || "",
          priority: occurrence.priority || "MEDIUM",
          status: occurrence.status || "Open",
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState<Errors>({});

  const condoOwners = useMemo(() => {
    if (!formData.condominiumId) return owners;
    return owners.filter((owner) =>
      (linksByOwner.get(owner.id) ?? []).some(
        (link) => link.unit.condominiumId === formData.condominiumId,
      ),
    );
  }, [owners, linksByOwner, formData.condominiumId]);

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("validation.titleRequired");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("validation.descriptionRequired");
    }

    if (!formData.condominiumId) {
      newErrors.condominiumId = t("validation.propertyRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result: Occurrence = {
      id: occurrence?.id ?? "",
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      condominiumId: formData.condominiumId,
      ownerId: formData.ownerId || null,
      unit: formData.unit.trim() || null,
      dateTime: occurrence?.dateTime ?? formatOccurrenceDate(new Date()),
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo.trim() || null,
      photos: occurrence?.photos ?? [],
      comments: occurrence?.comments ?? [],
      history: occurrence?.history ?? [
        {
          action: "reported",
          date: formatOccurrenceDate(new Date()),
          author: "Manager",
        },
      ],
    };

    onSave(result);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "condominiumId") {
        const ownerStillValid = (linksByOwner.get(prev.ownerId) ?? []).some(
          (link) => link.unit.condominiumId === value,
        );
        if (prev.ownerId && !ownerStillValid) next.ownerId = "";
      }
      if (field === "ownerId" && value) {
        const links = linksByOwner.get(value) ?? [];
        const match =
          links.find(
            (link) =>
              !next.condominiumId ||
              link.unit.condominiumId === next.condominiumId,
          ) ?? links[0];
        if (match) {
          next.unit = match.unit.label;
          if (!next.condominiumId) next.condominiumId = match.unit.condominiumId;
        }
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBackdropClick = (e: SyntheticEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth ${
      hasError ? "border-error" : "border-border-light"
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-1030 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface bg-white rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("detailsSection")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("title")} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputClass(Boolean(errors.title))}
                  placeholder={t("titlePlaceholder")}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-error">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("description")} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className={inputClass(Boolean(errors.description))}
                  placeholder={t("descriptionPlaceholder")}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-error">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("category")}
                  </label>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                  >
                    {OCCURRENCE_CATEGORY_VALUES.map((category) => (
                      <option key={category} value={category}>
                        {tCategory(category)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("priority")}
                  </label>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                  >
                    {OCCURRENCE_PRIORITY_VALUES.map((priority) => (
                      <option key={priority} value={priority}>
                        {tPriority(priority)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("locationSection")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("property")} *
                </label>
                <Select
                  value={formData.condominiumId}
                  onChange={(e) =>
                    handleChange("condominiumId", e.target.value)
                  }
                  invalid={Boolean(errors.condominiumId)}
                >
                  <option value="">{t("selectProperty")}</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
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
                  {t("unit")}
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className={inputClass(false)}
                  placeholder={t("unitPlaceholder")}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {t("handlingSection")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("reportedBy")}
                </label>
                <Select
                  value={formData.ownerId}
                  onChange={(e) => handleChange("ownerId", e.target.value)}
                >
                  <option value="">{t("selectOwner")}</option>
                  {condoOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.fullName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("assignedTo")}
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                  className={inputClass(false)}
                  placeholder={t("assignedToPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("status")}
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {OCCURRENCE_STATE_KEYS.map((state) => (
                    <option key={state} value={state}>
                      {tState(state)}
                    </option>
                  ))}
                </Select>
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
              <span>{occurrence ? t("update") : t("save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewOccurrenceModal;
