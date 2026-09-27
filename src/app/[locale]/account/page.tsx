"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import SectionCard from "@/components/ui/section-card";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";

import OrganizationForm from "./components/organization-form";
import TeamMembersSection from "./components/team-members-section";
import AccountDangerZone from "./components/account-danger-zone";

import type { Organization, TeamMember, TeamRole } from "./types";
import { EMPTY_ORGANIZATION } from "./types";

type BannerKind = "success" | "error";
type Banner = { type: BannerKind; message: string } | null;

type TeamPayload = {
  members: TeamMember[];
  canManageTeam?: boolean;
};

function AccountPage() {
  const t = useTranslations("account");
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const {
    organization: portfolioOrg,
    isReady,
    updateOrganization,
  } = usePortfolio();
  const router = useRouter();

  const [banner, setBanner] = useState<Banner>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [canManageTeam, setCanManageTeam] = useState(false);

  const organization = portfolioOrg ?? EMPTY_ORGANIZATION;

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

  const refreshTeam = useCallback(async () => {
    const data = await apiFetch<TeamPayload>("/api/team");
    setTeamMembers(data.members);
    setCanManageTeam(Boolean(data.canManageTeam));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    let cancelled = false;
    void (async () => {
      try {
        await refreshTeam();
      } catch {
        if (cancelled) return;
        setTeamMembers([]);
        setCanManageTeam(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user?.id, refreshTeam]);

  const showBanner = useCallback((type: BannerKind, message: string) => {
    setBanner({ type, message });
  }, []);

  const runTeamAction = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
        await refreshTeam();
        showBanner("success", t("saved"));
      } catch {
        showBanner("error", t("saveError"));
      }
    },
    [refreshTeam, showBanner, t],
  );

  const handleInvite = useCallback(
    (input: { email: string; role: TeamRole }) =>
      runTeamAction(async () => {
        await apiFetch("/api/team", {
          method: "POST",
          body: JSON.stringify({ email: input.email, role: input.role }),
        });
      }),
    [runTeamAction],
  );

  const handleRemoveMember = useCallback(
    (member: TeamMember) =>
      runTeamAction(async () => {
        await apiFetch(`/api/team?id=${encodeURIComponent(member.id)}`, {
          method: "DELETE",
        });
      }),
    [runTeamAction],
  );

  const handleChangeRole = useCallback(
    (member: TeamMember, role: TeamRole) =>
      runTeamAction(async () => {
        await apiFetch("/api/team", {
          method: "PATCH",
          body: JSON.stringify({ id: member.id, role }),
        });
      }),
    [runTeamAction],
  );

  const handleSaveOrganization = useCallback(
    async (next: Organization) => {
      try {
        await updateOrganization(next);
        showBanner("success", t("saved"));
      } catch {
        showBanner("error", t("saveError"));
      }
    },
    [showBanner, t, updateOrganization],
  );

  const handleConfirmDelete = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  if (isLoading || !user || !isReady) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-6 pb-8">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-56 bg-secondary-100 rounded" />
              <div className="h-4 w-80 bg-secondary-100 rounded" />
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

      <main className="px-6 pb-8">
        <div className="max-w-6xl mx-auto px-6 py-8">
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
                name={
                  banner.type === "success" ? "CheckCircle2" : "AlertCircle"
                }
                size={18}
              />
              <span className="text-sm font-medium">{banner.message}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="ml-auto p-1 hover:opacity-80"
                aria-label={t("dismiss")}
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          )}

          <div className="space-y-8">
            <SectionCard
              title={t("sections.organization")}
              description={t("sections.organizationSubtitle")}
            >
              <OrganizationForm
                organization={organization}
                onSave={handleSaveOrganization}
              />
            </SectionCard>

            <SectionCard
              title={t("sections.team")}
              description={t("sections.teamSubtitle")}
            >
              <TeamMembersSection
                members={teamMembers}
                onInvite={canManageTeam ? handleInvite : undefined}
                onRemove={canManageTeam ? handleRemoveMember : undefined}
                onChangeRole={canManageTeam ? handleChangeRole : undefined}
              />
            </SectionCard>

            <SectionCard
              title={t("sections.dangerZone")}
              description={t("sections.dangerZoneSubtitle")}
              tone="danger"
            >
              <AccountDangerZone
                organizationName={organization.name}
                onConfirmDelete={handleConfirmDelete}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountPage;
