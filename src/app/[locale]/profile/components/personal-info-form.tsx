"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import ProfileAvatar from "./profile-avatar";
import type { User } from "@/app/types";

interface PersonalInfoFormProps {
  user: User;
  onSave: (updates: Partial<User>) => Promise<void>;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s()-]{5,}$/;

const buildInitialState = (user: User): FormState => ({
  name: user.name ?? "",
  email: user.email ?? "",
  phone: user.phone ?? "",
  avatar: user.avatar ?? null,
});

function PersonalInfoForm({ user, onSave }: PersonalInfoFormProps) {
  const t = useTranslations("profile.personalInfo");
  const tVal = useTranslations("profile.personalInfo.validation");

  const initial = useMemo(() => buildInitialState(user), [user]);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(initial);
    setErrors({});
  }, [initial]);

  const isDirty = useMemo(
    () =>
      form.name !== initial.name ||
      form.email !== initial.email ||
      form.phone !== initial.phone ||
      form.avatar !== initial.avatar,
    [form, initial],
  );

  const handleField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) {
      next.name = tVal("nameRequired");
    } else if (name.length < 2) {
      next.name = tVal("nameTooShort");
    }

    if (!email) {
      next.email = tVal("emailRequired");
    } else if (!EMAIL_REGEX.test(email)) {
      next.email = tVal("emailInvalid");
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      next.phone = tVal("phoneInvalid");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !isDirty) return;
    setIsSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        avatar: form.avatar,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initial);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        <ProfileAvatar
          name={form.name || user.name}
          avatar={form.avatar}
          onChange={(value) => handleField("avatar", value)}
          disabled={isSaving}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("fullName")} <span className="text-error">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => handleField("name", event.target.value)}
              placeholder={t("fullNamePlaceholder")}
              disabled={isSaving}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
                errors.name ? "border-error" : "border-border-medium"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("email")} <span className="text-error">*</span>
            </label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => handleField("email", event.target.value)}
              placeholder={t("emailPlaceholder")}
              disabled={isSaving}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
                errors.email ? "border-error" : "border-border-medium"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("phone")}
            </label>
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => handleField("phone", event.target.value)}
              placeholder={t("phonePlaceholder")}
              disabled={isSaving}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
                errors.phone ? "border-error" : "border-border-medium"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-role"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("role")}
            </label>
            <input
              id="profile-role"
              type="text"
              value={user.role}
              disabled
              readOnly
              className="w-full rounded-lg border border-border-medium bg-secondary-50 px-3 py-2 text-sm text-text-secondary cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-text-secondary">{t("roleHint")}</p>
          </div>
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

export default PersonalInfoForm;
