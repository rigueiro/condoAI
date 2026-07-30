"use client";

import React, {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  AuthAlert,
  AuthCardHeader,
  AuthLoading,
  AuthPasswordField,
  AuthPrimaryLink,
  AuthShell,
  AuthStatusPanel,
  AuthSubmitButton,
  AuthTextLink,
} from "@/components/auth";
import {
  MIN_PASSWORD_LENGTH,
  resolveAuthErrorMessage,
  useAuth,
  useAuthHrefs,
} from "@/lib/auth";

type Errors = {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
};

type TokenStatus = "checking" | "valid" | "invalid" | "expired" | "success";

const RESET_ERROR_KEYS = [
  "invalidResetToken",
  "expiredResetToken",
  "passwordResetFailed",
  "passwordTooShort",
] as const;

function ResetPasswordForm() {
  const t = useTranslations("auth.passwordReset.reset");
  const tAuth = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { validateResetToken, resetPassword } = useAuth();
  const hrefs = useAuthHrefs();

  const [status, setStatus] = useState<TokenStatus>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkToken = async () => {
      if (!token) {
        if (!cancelled) setStatus("invalid");
        return;
      }
      try {
        const result = await validateResetToken(token);
        if (!cancelled) {
          setEmail(result.email);
          setStatus("valid");
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        setStatus(message === "expiredResetToken" ? "expired" : "invalid");
      }
    };

    void checkToken();
    return () => {
      cancelled = true;
    };
  }, [token, validateResetToken]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof Errors] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.newPassword) {
      next.newPassword = t("passwordRequired");
    } else if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      next.newPassword = t("passwordMinLength", { min: MIN_PASSWORD_LENGTH });
    }
    if (!form.confirmPassword) {
      next.confirmPassword = t("confirmRequired");
    } else if (form.confirmPassword !== form.newPassword) {
      next.confirmPassword = t("noMatch");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, form.newPassword);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "passwordResetFailed";
      if (message === "expiredResetToken") {
        setStatus("expired");
      } else if (message === "invalidResetToken") {
        setStatus("invalid");
      } else {
        setErrors({
          general: resolveAuthErrorMessage(
            message,
            tAuth,
            "passwordResetFailed",
            RESET_ERROR_KEYS,
            { min: MIN_PASSWORD_LENGTH },
          ),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const recoveryActions = (
    <div className="space-y-3">
      <AuthPrimaryLink href={hrefs.forgotPassword}>
        {t("requestNew")}
      </AuthPrimaryLink>
      <AuthTextLink href={hrefs.login} back>
        {t("backToLogin")}
      </AuthTextLink>
    </div>
  );

  return (
    <AuthShell>
      {status === "checking" && <AuthLoading label={t("validating")} />}

      {status === "invalid" && (
        <AuthStatusPanel
          icon="Link2Off"
          title={t("invalidTitle")}
          body={t("invalidBody")}
          actions={recoveryActions}
        />
      )}

      {status === "expired" && (
        <AuthStatusPanel
          icon="Clock"
          title={t("expiredTitle")}
          body={t("expiredBody")}
          actions={recoveryActions}
        />
      )}

      {status === "success" && (
        <AuthStatusPanel
          icon="CheckCircle"
          title={t("successTitle")}
          body={t("successBody")}
          actions={
            <AuthPrimaryLink href={hrefs.login} icon="LogIn">
              {t("goToLogin")}
            </AuthPrimaryLink>
          }
        />
      )}

      {status === "valid" && (
        <>
          <AuthCardHeader
            icon="LockKeyhole"
            title={t("title")}
            subtitle={
              email ? t("subtitle", { email }) : t("subtitleGeneric")
            }
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && <AuthAlert>{errors.general}</AuthAlert>}

            <AuthPasswordField
              id="newPassword"
              name="newPassword"
              label={t("newPasswordLabel")}
              value={form.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder={t("passwordPlaceholder", {
                min: MIN_PASSWORD_LENGTH,
              })}
              disabled={isSubmitting}
              autoFocus
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword((v) => !v)}
            />

            <AuthPasswordField
              id="confirmPassword"
              name="confirmPassword"
              label={t("confirmPasswordLabel")}
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder={t("passwordPlaceholder", {
                min: MIN_PASSWORD_LENGTH,
              })}
              disabled={isSubmitting}
              showPassword={showPassword}
            />

            <AuthSubmitButton
              busy={isSubmitting}
              busyLabel={t("submitting")}
              label={t("submit")}
              icon="Check"
            />

            <AuthTextLink href={hrefs.login} back>
              {t("backToLogin")}
            </AuthTextLink>
          </form>
        </>
      )}
    </AuthShell>
  );
}

function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthLoading />
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

export default ResetPasswordPage;
