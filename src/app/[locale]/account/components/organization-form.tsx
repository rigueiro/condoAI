"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type { Organization } from "../types";

interface OrganizationFormProps {
  organization: Organization;
  onSave: (next: Organization) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof Organization, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const TAX_ID_REGEX = /^[A-Z0-9-]{6,}$/i;

const COUNTRIES: { value: string; label: string }[] = [
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Spain" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "DE", label: "Germany" },
  { value: "GB", label: "United Kingdom" },
  { value: "BR", label: "Brazil" },
];

function OrganizationForm({ organization, onSave }: OrganizationFormProps) {
  const t = useTranslations("account.organization");
  const tVal = useTranslations("account.organization.validation");

  const [form, setForm] = useState<Organization>(organization);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(organization);
    setErrors({});
  }, [organization]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(organization),
    [form, organization],
  );

  const handleField = <K extends keyof Organization>(
    field: K,
    value: Organization[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!form.name.trim()) {
      next.name = tVal("nameRequired");
    }
    if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
      next.email = tVal("emailInvalid");
    }
    if (form.taxId && !TAX_ID_REGEX.test(form.taxId.trim())) {
      next.taxId = tVal("taxIdInvalid");
    }
    if (form.website && !URL_REGEX.test(form.website.trim())) {
      next.website = tVal("websiteInvalid");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !isDirty) return;
    setIsSaving(true);
    try {
      const trimmed: Organization = {
        name: form.name.trim(),
        legalName: form.legalName.trim(),
        taxId: form.taxId.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country,
      };
      await onSave(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(organization);
    setErrors({});
  };

  const renderInput = (
    field: keyof Organization,
    label: string,
    placeholder: string,
    options: { required?: boolean; type?: string } = {},
  ) => (
    <div>
      <label
        htmlFor={`org-${field}`}
        className="block text-sm font-medium text-text-primary mb-2"
      >
        {label}
        {options.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        id={`org-${field}`}
        type={options.type ?? "text"}
        value={form[field] as string}
        onChange={(event) => handleField(field, event.target.value)}
        placeholder={placeholder}
        disabled={isSaving}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
          errors[field] ? "border-error" : "border-border-medium"
        }`}
      />
      {errors[field] && (
        <p className="mt-1 text-xs text-error flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          <span>{errors[field]}</span>
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderInput("name", t("name"), t("namePlaceholder"), {
          required: true,
        })}
        {renderInput("legalName", t("legalName"), t("legalNamePlaceholder"))}
        {renderInput("taxId", t("taxId"), t("taxIdPlaceholder"))}
        {renderInput("website", t("website"), t("websitePlaceholder"), {
          type: "url",
        })}
        {renderInput("email", t("email"), t("emailPlaceholder"), {
          type: "email",
        })}
        {renderInput("phone", t("phone"), t("phonePlaceholder"), {
          type: "tel",
        })}

        <div className="md:col-span-2">
          {renderInput(
            "addressLine1",
            t("addressLine1"),
            t("addressLine1Placeholder"),
          )}
        </div>

        {renderInput("city", t("city"), t("cityPlaceholder"))}
        {renderInput(
          "postalCode",
          t("postalCode"),
          t("postalCodePlaceholder"),
        )}

        <div className="md:col-span-2">
          <label
            htmlFor="org-country"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {t("country")}
          </label>
          <select
            id="org-country"
            value={form.country}
            onChange={(event) => handleField("country", event.target.value)}
            disabled={isSaving}
            className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
          >
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-6 border-t border-border-light">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!isDirty || isSaving}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          loading={isSaving}
          disabled={!isDirty || isSaving}
          iconName="Save"
          className="text-white"
        >
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export default OrganizationForm;
