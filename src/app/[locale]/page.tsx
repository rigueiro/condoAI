"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import LocaleSwitcher from "@/components/locale-switcher";
import { useAuth } from "@/lib/auth";

const PATTERN_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function HomePage() {
  const t = useTranslations("home");
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat"
          style={{ backgroundImage: PATTERN_BG }}
        />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="bg-surface rounded-2xl shadow-modal border border-border-light p-8 sm:p-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="Building2" size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            {t("brand")}
          </h1>
          <p className="text-text-secondary text-base mb-8">{t("tagline")}</p>

          {!isLoading && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
                >
                  <Icon name="LayoutDashboard" size={20} />
                  {t("goToDashboard")}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 border border-border-medium text-text-primary py-3 px-6 rounded-lg font-medium hover:bg-secondary-50 transition-smooth"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
                  >
                    <Icon name="UserPlus" size={20} />
                    {t("signup")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-text-secondary mt-8">
          {t("footer", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
