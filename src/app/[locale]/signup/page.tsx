"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  AuthAlert,
  AuthCardHeader,
  AuthEmailField,
  AuthPasswordField,
  AuthShell,
  AuthSubmitButton,
  AuthTextLink,
} from "@/components/auth";
import Icon from "@/components/icon";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  resolveAuthErrorMessage,
  useAuth,
  useAuthHrefs,
} from "@/lib/auth";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const SIGNUP_ERROR_KEYS = [
  "emailAlreadyRegistered",
  "signupFailed",
  "passwordTooShort",
] as const;

function Signup() {
  const t = useTranslations("signup");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const { signup } = useAuth();
  const hrefs = useAuthHrefs();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (name: string) => {
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const validateForm = () => {
    const next: Errors = {};

    if (!formData.name.trim()) {
      next.name = t("nameRequired");
    }

    if (!formData.email.trim()) {
      next.email = t("emailRequired");
    } else if (!isValidEmail(formData.email)) {
      next.email = t("emailInvalid");
    }

    if (!formData.password.trim()) {
      next.password = t("passwordRequired");
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      next.password = t("passwordMinLength", { min: MIN_PASSWORD_LENGTH });
    }

    if (!formData.confirmPassword.trim()) {
      next.confirmPassword = t("confirmRequired");
    } else if (formData.password !== formData.confirmPassword) {
      next.confirmPassword = t("noMatch");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signup(formData.name, formData.email, formData.password);
      router.push("/onboarding");
    } catch (error) {
      const messageKey =
        error instanceof Error ? error.message : "signupFailed";
      setErrors({
        general: resolveAuthErrorMessage(
          messageKey,
          tAuth,
          "signupFailed",
          SIGNUP_ERROR_KEYS,
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      footer={
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-text-secondary">
            {t("haveAccount")}{" "}
            <AuthTextLink href={hrefs.login}>{t("signInLink")}</AuthTextLink>
          </p>
          <p className="text-sm text-text-secondary">
            {t("footer", { year: new Date().getFullYear() })}
          </p>
        </div>
      }
    >
      <AuthCardHeader
        icon="UserPlus"
        title={t("brand")}
        subtitle={t("creatingAccount")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.general && <AuthAlert>{errors.general}</AuthAlert>}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {t("nameLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="User" size={20} color="var(--color-secondary)" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth disabled:opacity-60 ${
                errors.name ? "border-error" : "border-border-medium"
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-error flex items-center space-x-1">
              <Icon name="AlertCircle" size={16} />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        <AuthEmailField
          label={t("emailLabel")}
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder={t("emailPlaceholder")}
          disabled={isSubmitting}
        />

        <AuthPasswordField
          id="password"
          name="password"
          label={t("passwordLabel")}
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          placeholder={t("passwordPlaceholder", { min: MIN_PASSWORD_LENGTH })}
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        <AuthPasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t("confirmPasswordLabel")}
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          placeholder={t("passwordPlaceholder", { min: MIN_PASSWORD_LENGTH })}
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        <AuthSubmitButton
          busy={isSubmitting}
          busyLabel={t("signingUpButton")}
          label={t("signUpButton")}
          icon="UserPlus"
        />
      </form>
    </AuthShell>
  );
}

export default Signup;
