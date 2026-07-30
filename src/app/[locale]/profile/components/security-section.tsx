"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import { MIN_PASSWORD_LENGTH, useAuth } from "@/lib/auth";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

type FormState = Record<Field, string>;
type FieldErrors = Partial<Record<Field, string>>;

const INITIAL_STATE: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function SecuritySection() {
  const t = useTranslations("profile.security");
  const tVal = useTranslations("profile.security.validation");
  const tAuth = useTranslations("auth");
  const { changePassword } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [visible, setVisible] = useState<Record<Field, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleField = (field: Field, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (successMessage) setSuccessMessage(null);
    if (formError) setFormError(null);
  };

  const toggleVisibility = (field: Field) => {
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.currentPassword.trim()) {
      next.currentPassword = tVal("currentRequired");
    }
    if (!form.newPassword) {
      next.newPassword = tVal("newRequired");
    } else if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      next.newPassword = tVal("tooShort", { min: MIN_PASSWORD_LENGTH });
    } else if (form.newPassword === form.currentPassword) {
      next.newPassword = tVal("sameAsCurrent");
    }
    if (form.confirmPassword !== form.newPassword) {
      next.confirmPassword = tVal("noMatch");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setForm(INITIAL_STATE);
      setSuccessMessage(t("passwordUpdated"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "passwordChangeFailed";
      if (message === "incorrectCurrentPassword") {
        setErrors({ currentPassword: tAuth("incorrectCurrentPassword") });
      } else if (message === "sameAsCurrentPassword") {
        setErrors({ newPassword: tAuth("sameAsCurrentPassword") });
      } else {
        setFormError(tAuth("passwordChangeFailed"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderPasswordField = (field: Field, label: string) => (
    <div>
      <label
        htmlFor={`profile-${field}`}
        className="block text-sm font-medium text-text-primary mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={`profile-${field}`}
          type={visible[field] ? "text" : "password"}
          value={form[field]}
          onChange={(event) => handleField(field, event.target.value)}
          autoComplete={
            field === "currentPassword" ? "current-password" : "new-password"
          }
          disabled={isSaving}
          className={`w-full rounded-lg border bg-surface px-3 py-2 pr-10 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
            errors[field] ? "border-error" : "border-border-medium"
          }`}
        />
        <button
          type="button"
          onClick={() => toggleVisibility(field)}
          className="absolute inset-y-0 right-0 px-3 text-text-secondary hover:text-text-primary"
          aria-label={visible[field] ? "Hide password" : "Show password"}
        >
          <Icon name={visible[field] ? "EyeOff" : "Eye"} size={16} />
        </button>
      </div>
      {errors[field] && (
        <p className="mt-1 text-xs text-error flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          <span>{errors[field]}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            {renderPasswordField("currentPassword", t("currentPassword"))}
          </div>
          {renderPasswordField("newPassword", t("newPassword"))}
          {renderPasswordField("confirmPassword", t("confirmPassword"))}
        </div>

        <p className="mt-3 text-xs text-text-secondary flex items-start gap-1.5">
          <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
          <span>{t("passwordHint", { min: MIN_PASSWORD_LENGTH })}</span>
        </p>

        {successMessage && (
          <div className="mt-4 p-3 bg-success-50 border border-success-100 rounded-lg flex items-center gap-2">
            <Icon
              name="CheckCircle2"
              size={16}
              color="var(--color-success)"
            />
            <span className="text-sm text-success">{successMessage}</span>
          </div>
        )}

        {formError && (
          <div className="mt-4 p-3 bg-error-50 border border-error-100 rounded-lg flex items-center gap-2">
            <Icon name="AlertCircle" size={16} color="var(--color-error)" />
            <span className="text-sm text-error">{formError}</span>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            loading={isSaving}
            iconName="Lock"
            className="text-white"
          >
            {isSaving ? t("updating") : t("changePassword")}
          </Button>
        </div>
      </form>

      <div className="border-t border-border-light pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">
                {t("twoFactor")}
              </h3>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  twoFactorEnabled
                    ? "bg-success-50 text-success"
                    : "bg-secondary-100 text-text-secondary"
                }`}
              >
                {twoFactorEnabled
                  ? t("twoFactorEnabled")
                  : t("twoFactorDisabled")}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {t("twoFactorDesc")}
            </p>
          </div>
          <Button
            type="button"
            variant={twoFactorEnabled ? "outline" : "primary"}
            size="sm"
            iconName={twoFactorEnabled ? "ShieldOff" : "Shield"}
            onClick={() => setTwoFactorEnabled((prev) => !prev)}
            className={twoFactorEnabled ? "" : "text-white"}
          >
            {twoFactorEnabled ? t("disable") : t("enable")}
          </Button>
        </div>
      </div>

      <div className="border-t border-border-light pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-primary">
              {t("activeSessions")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {t("activeSessionsDesc")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconName="LogOut"
          >
            {t("signOutAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SecuritySection;
