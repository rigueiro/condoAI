"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import SectionCard from "@/components/ui/section-card";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { useRouter } from "@/i18n/navigation";

import OrganizationForm from "./components/organization-form";
import SubscriptionSection from "./components/subscription-section";
import BillingSection from "./components/billing-section";
import InvoicesSection from "./components/invoices-section";
import TeamMembersSection from "./components/team-members-section";
import IntegrationsSection from "./components/integrations-section";
import AccountDangerZone from "./components/account-danger-zone";

import type {
  Integration,
  Invoice,
  Organization,
  PaymentMethod,
  Subscription,
  TeamMember,
  TeamRole,
} from "./types";

type Banner = { type: "success" | "error"; message: string } | null;

const DEFAULT_ORGANIZATION: Organization = {
  name: "CondoAI Lda.",
  legalName: "CondoAI Sociedade Unipessoal Lda.",
  taxId: "PT509123456",
  email: "billing@condoai.pt",
  phone: "+351 21 000 0000",
  website: "https://condoai.pt",
  addressLine1: "Av. da Liberdade 100, 4º",
  city: "Lisboa",
  postalCode: "1250-145",
  country: "PT",
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  planId: "professional",
  cycle: "yearly",
  renewsAt: "2027-01-15",
  usage: {
    properties: { used: 24, limit: 50 },
    units: { used: 486, limit: 1000 },
    users: { used: 6, limit: 10 },
    storageMb: { used: 3400, limit: 10240 },
  },
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = {
  brand: "Visa",
  last4: "4242",
  expiryMonth: 9,
  expiryYear: 2028,
};

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "inv-2026-04",
    number: "INV-2026-04",
    date: "2026-04-15",
    amount: 79,
    currency: "EUR",
    status: "paid",
  },
  {
    id: "inv-2026-03",
    number: "INV-2026-03",
    date: "2026-03-15",
    amount: 79,
    currency: "EUR",
    status: "paid",
  },
  {
    id: "inv-2026-02",
    number: "INV-2026-02",
    date: "2026-02-15",
    amount: 79,
    currency: "EUR",
    status: "paid",
  },
  {
    id: "inv-2026-01",
    number: "INV-2026-01",
    date: "2026-01-15",
    amount: 79,
    currency: "EUR",
    status: "refunded",
  },
];

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: "stripe", icon: "CreditCard", connected: true },
  { id: "sepa", icon: "Landmark", connected: true },
  { id: "google", icon: "Calendar", connected: false },
  { id: "slack", icon: "MessageSquare", connected: false },
  { id: "zapier", icon: "Zap", connected: false },
];

function AccountPage() {
  const t = useTranslations("account");
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const {
    organization: portfolioOrg,
    isDemo,
    portfolio,
    updateOrganization,
  } = usePortfolio();
  const router = useRouter();

  const [organizationOverride, setOrganizationOverride] =
    useState<Organization | null>(null);
  const [billingEmailOverride, setBillingEmailOverride] = useState<
    string | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    DEFAULT_PAYMENT_METHOD,
  );
  const [invoices] = useState<Invoice[]>(DEFAULT_INVOICES);
  const [integrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS);
  const [banner, setBanner] = useState<Banner>(null);

  const organization =
    organizationOverride ??
    (!isDemo && portfolioOrg ? portfolioOrg : DEFAULT_ORGANIZATION);

  const billingEmail =
    billingEmailOverride ?? organization.email;

  const subscription = useMemo<Subscription>(() => {
    if (isDemo) return DEFAULT_SUBSCRIPTION;
    return {
      ...DEFAULT_SUBSCRIPTION,
      usage: {
        ...DEFAULT_SUBSCRIPTION.usage,
        properties: {
          ...DEFAULT_SUBSCRIPTION.usage.properties,
          used: portfolio.condominiums.length,
        },
        units: {
          ...DEFAULT_SUBSCRIPTION.usage.units,
          used: portfolio.condominiums.reduce(
            (s, c) => s + c.numberOfUnits,
            0,
          ),
        },
        users: { ...DEFAULT_SUBSCRIPTION.usage.users, used: 1 },
      },
    };
  }, [isDemo, portfolio]);

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

  const teamMembers = useMemo<TeamMember[]>(() => {
    const currentUserId = user?.id ?? "1";
    return [
      {
        id: currentUserId,
        name: user?.name ?? "Rafael Rigueiro",
        email: user?.email ?? "admin@condoai.pt",
        role: "owner",
        status: "active",
        lastActiveAt: new Date().toISOString(),
        isCurrentUser: true,
      },
      {
        id: "u-2",
        name: "Sofia Almeida",
        email: "sofia.almeida@condoai.pt",
        role: "admin",
        status: "active",
        lastActiveAt: "2026-05-19T08:42:00Z",
      },
      {
        id: "u-3",
        name: "Tiago Carvalho",
        email: "tiago.carvalho@condoai.pt",
        role: "manager",
        status: "active",
        lastActiveAt: "2026-05-15T14:10:00Z",
      },
      {
        id: "u-4",
        name: "Marta Lopes",
        email: "marta.lopes@condoai.pt",
        role: "staff",
        status: "invited",
      },
      {
        id: "u-5",
        name: "André Pinto",
        email: "andre.pinto@condoai.pt",
        role: "viewer",
        status: "inactive",
        lastActiveAt: "2026-02-02T11:00:00Z",
      },
    ];
  }, [user]);

  const showSuccess = (message: string) =>
    setBanner({ type: "success", message });

  const handleSaveOrganization = useCallback(
    async (next: Organization) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setOrganizationOverride(next);
      if (!isDemo) {
        updateOrganization(next);
      }
      showSuccess(t("saved"));
    },
    [t, isDemo, updateOrganization],
  );

  const handleUpdateBillingEmail = useCallback(
    async (email: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setBillingEmailOverride(email);
      showSuccess(t("saved"));
    },
    [t],
  );

  const handleInvite = useCallback(
    async (_input: { email: string; role: TeamRole }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      showSuccess(t("saved"));
    },
    [t],
  );

  const handleConfirmDelete = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-8">
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

      <main className="pt-20 px-6 pb-8">
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
                aria-label="Dismiss"
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
              title={t("sections.subscription")}
              description={t("sections.subscriptionSubtitle")}
            >
              <SubscriptionSection subscription={subscription} />
            </SectionCard>

            <SectionCard
              title={t("sections.billing")}
              description={t("sections.billingSubtitle")}
            >
              <BillingSection
                paymentMethod={paymentMethod}
                billingEmail={billingEmail}
                onUpdateBillingEmail={handleUpdateBillingEmail}
              />
            </SectionCard>

            <SectionCard
              title={t("sections.invoices")}
              description={t("sections.invoicesSubtitle")}
              action={
                invoices.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="ExternalLink"
                  >
                    {t("invoices.viewAll")}
                  </Button>
                ) : null
              }
            >
              <InvoicesSection invoices={invoices} />
            </SectionCard>

            <SectionCard
              title={t("sections.team")}
              description={t("sections.teamSubtitle")}
            >
              <TeamMembersSection
                members={teamMembers}
                onInvite={handleInvite}
              />
            </SectionCard>

            <SectionCard
              title={t("sections.integrations")}
              description={t("sections.integrationsSubtitle")}
            >
              <IntegrationsSection integrations={integrations} />
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
