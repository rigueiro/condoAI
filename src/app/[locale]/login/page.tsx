"use client";

import React, { ChangeEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Icon from "@/components/icon";
import LocaleSwitcher from "@/components/locale-switcher";
import { useAuth } from "@/lib/auth";

type Errors = {
  [key: string]: string;
};

function Login() {
  const t = useTranslations("login");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Errors>({});

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("emailInvalid");
    }

    if (!formData.password.trim()) {
      newErrors.password = t("passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password, {
        rememberMe: formData.rememberMe,
      });
      router.push("/dashboard");
    } catch (error) {
      const err = error as Error;
      const messageKey = err.message;
      const authErrorKeys = [
        "invalidCredentials",
        "loginFailed",
        "logoutFailed",
      ] as const;
      setErrors({
        general: authErrorKeys.includes(
          messageKey as (typeof authErrorKeys)[number],
        )
          ? tAuth(messageKey as (typeof authErrorKeys)[number])
          : tAuth("loginFailed"),
      });
    }
  };

  const handleForgotPassword = () => {
    alert(t("forgotPasswordAlert"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-modal border border-border-light p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Building2" size={32} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {t("brand")}
            </h1>
            <p className="text-text-secondary">{t("signingIn")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-error-50 border border-error-100 rounded-lg p-4 flex items-center space-x-3">
                <Icon name="AlertCircle" size={20} color="var(--color-error)" />
                <span className="text-error text-sm">{errors.general}</span>
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("emailLabel")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Mail" size={20} color="var(--color-secondary)" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                    errors.email ? "border-error" : "border-border-medium"
                  }`}
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <Icon name="AlertCircle" size={16} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={20} color="var(--color-secondary)" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth ${
                    errors.password ? "border-error" : "border-border-medium"
                  }`}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-error flex items-center space-x-1">
                  <Icon name="AlertCircle" size={16} />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm text-text-secondary">
                  {t("rememberMe")}
                </span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary-700 transition-smooth"
              >
                {t("forgotPassword")}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary border-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t("signingInButton")}</span>
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={20} />
                  <span>{t("signInButton")}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-text-secondary">
            {t("footer", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
