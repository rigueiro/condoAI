"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AuthAlert,
  AuthCardHeader,
  AuthEmailField,
  AuthNotice,
  AuthShell,
  AuthSubmitButton,
  AuthTextLink,
} from "@/components/auth";
import { isValidEmail, useAuth, useAuthHrefs } from "@/lib/auth";

type Errors = {
  email?: string;
  general?: string;
};

function ForgotPasswordPage() {
  const t = useTranslations("auth.passwordReset.forgot");
  const { requestPasswordReset } = useAuth();
  const hrefs = useAuthHrefs();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email || errors.general) setErrors({});
  };

  const validate = () => {
    const next: Errors = {};
    if (!email.trim()) {
      next.email = t("emailRequired");
    } else if (!isValidEmail(email)) {
      next.email = t("emailInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      // Never reveal whether the account exists in the UI. In development,
      // log the reset link so demos / e2e can continue without email.
      if (isDev && result.demoResetToken) {
        console.info(
          `[CondoAI demo] Password reset link for ${email.trim()}: ${hrefs.absoluteResetPassword(result.demoResetToken)}`,
        );
      }
      setSubmittedEmail(email.trim());
    } catch {
      setErrors({ general: t("emailInvalid") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAnother = () => {
    setSubmittedEmail(null);
    setEmail("");
    setErrors({});
  };

  return (
    <AuthShell>
      <AuthCardHeader
        icon="KeyRound"
        title={submittedEmail ? t("successTitle") : t("title")}
        subtitle={
          submittedEmail
            ? t("successBody", { email: submittedEmail })
            : t("subtitle")
        }
      />

      {submittedEmail ? (
        <div className="space-y-6">
          {isDev && <AuthNotice>{t("demoNotice")}</AuthNotice>}

          <button
            type="button"
            onClick={handleRequestAnother}
            className="w-full text-sm text-primary hover:text-primary-700 transition-smooth"
          >
            {t("requestAnother")}
          </button>

          <AuthTextLink href={hrefs.login} back>
            {t("backToLogin")}
          </AuthTextLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && <AuthAlert>{errors.general}</AuthAlert>}

          <AuthEmailField
            label={t("emailLabel")}
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
            placeholder={t("emailPlaceholder")}
            disabled={isSubmitting}
            autoFocus
          />

          <AuthSubmitButton
            busy={isSubmitting}
            busyLabel={t("submitting")}
            label={t("submit")}
            icon="Send"
          />

          <AuthTextLink href={hrefs.login} back>
            {t("backToLogin")}
          </AuthTextLink>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotPasswordPage;
