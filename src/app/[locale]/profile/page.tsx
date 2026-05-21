"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@/app/types";
import SectionCard from "@/components/ui/section-card";
import PersonalInfoForm from "./components/personal-info-form";
import SecuritySection from "./components/security-section";
import PreferencesSection from "./components/preferences-section";
import NotificationsSection from "./components/notifications-section";
import DangerZoneSection from "./components/danger-zone-section";

type Banner = { type: "success" | "error"; message: string } | null;

function ProfilePage() {
  const t = useTranslations("profile");
  const { user, isLoading, isAuthenticated, updateUser, logout } = useAuth();
  const router = useRouter();
  const [banner, setBanner] = useState<Banner>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const handleSavePersonalInfo = useCallback(
    async (updates: Partial<User>) => {
      try {
        await updateUser(updates);
        setBanner({ type: "success", message: t("saved") });
      } catch {
        setBanner({ type: "error", message: t("saveError") });
      }
    },
    [t, updateUser],
  );

  const handleDeleteAccount = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-8">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-secondary-100 rounded" />
              <div className="h-4 w-72 bg-secondary-100 rounded" />
              <div className="h-64 bg-secondary-100 rounded-lg" />
              <div className="h-64 bg-secondary-100 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-6 pb-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary">{t("subtitle")}</p>
          </div>

          {banner && (
            <div
              role="status"
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
                banner.type === "success"
                  ? "bg-success-50 border-success-100 text-success"
                  : "bg-error-50 border-error-100 text-error"
              }`}
            >
              <Icon
                name={banner.type === "success" ? "CheckCircle2" : "AlertCircle"}
                size={18}
              />
              <span className="text-sm font-medium">{banner.message}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="ml-auto p-1 hover:opacity-80"
                aria-label="Dismiss"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          )}

          <div className="space-y-8">
            <SectionCard
              title={t("sections.personalInfo")}
              description={t("sections.personalInfoSubtitle")}
            >
              <PersonalInfoForm user={user} onSave={handleSavePersonalInfo} />
            </SectionCard>

            <SectionCard
              title={t("sections.security")}
              description={t("sections.securitySubtitle")}
            >
              <SecuritySection />
            </SectionCard>

            <SectionCard
              title={t("sections.preferences")}
              description={t("sections.preferencesSubtitle")}
            >
              <PreferencesSection />
            </SectionCard>

            <SectionCard
              title={t("sections.notifications")}
              description={t("sections.notificationsSubtitle")}
            >
              <NotificationsSection />
            </SectionCard>

            <SectionCard
              title={t("sections.dangerZone")}
              description={t("sections.dangerZoneSubtitle")}
              tone="danger"
            >
              <DangerZoneSection onConfirmDelete={handleDeleteAccount} />
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
