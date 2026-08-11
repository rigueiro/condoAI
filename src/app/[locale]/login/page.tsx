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
import {
  MIN_PASSWORD_LENGTH,
  isDemoEmail,
  isValidEmail,
  resolveAuthErrorMessage,
  useAuth,
  useAuthHrefs,
} from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { needsOnboarding, type Portfolio } from "@/lib/portfolio";

type Errors = {
  email?: string;
  password?: string;
  general?: string;
};

const LOGIN_ERROR_KEYS = [
  "invalidCredentials",
  "loginFailed",
  "logoutFailed",
] as const;

function Login() {
  const t = useTranslations("login");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const hrefs = useAuthHrefs();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (name: string) => {
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearFieldError(name);
  };

  const validateForm = () => {
    const next: Errors = {};

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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password, {
        rememberMe: formData.rememberMe,
      });
      const email = formData.email.trim().toLowerCase();
      if (isDemoEmail(email)) {
        router.push("/dashboard");
      } else {
        try {
          const data = await apiFetch<{ portfolio: Portfolio }>(
            "/api/portfolio",
          );
          if (needsOnboarding(data.portfolio)) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        } catch {
          router.push("/onboarding");
        }
      }
    } catch (error) {
      const messageKey = error instanceof Error ? error.message : "loginFailed";
      setErrors({
        general: resolveAuthErrorMessage(
          messageKey,
          tAuth,
          "loginFailed",
          LOGIN_ERROR_KEYS,
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      footer={
        <div className="text-center mt-8">
          <p className="text-sm text-text-secondary">
            {t("footer", { year: new Date().getFullYear() })}
          </p>
        </div>
      }
    >
      <AuthCardHeader
        icon="Building2"
        title={t("brand")}
        subtitle={t("signingIn")}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && <AuthAlert>{errors.general}</AuthAlert>}

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
          placeholder={t("passwordPlaceholder")}
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm text-text-secondary">
              {t("rememberMe")}
            </span>
          </label>

          <AuthTextLink href={hrefs.forgotPassword}>
            {t("forgotPassword")}
          </AuthTextLink>
        </div>

        <AuthSubmitButton
          busy={isSubmitting}
          busyLabel={t("signingInButton")}
          label={t("signInButton")}
          icon="LogIn"
        />
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        {t("noAccount")}{" "}
        <AuthTextLink href={hrefs.signup}>{t("signUpLink")}</AuthTextLink>
      </p>
    </AuthShell>
  );
}

export default Login;
