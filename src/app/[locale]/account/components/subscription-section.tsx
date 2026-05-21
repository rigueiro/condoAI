"use client";

import React, { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type {
  BillingCycle,
  Subscription,
  SubscriptionLimit,
  SubscriptionPlanId,
} from "../types";

interface SubscriptionSectionProps {
  subscription: Subscription;
  onSelectPlan?: (planId: SubscriptionPlanId, cycle: BillingCycle) => void;
}

interface PlanConfig {
  id: SubscriptionPlanId;
  monthly: number | null;
  yearly: number | null;
  popular?: boolean;
}

const PLAN_CATALOG: PlanConfig[] = [
  { id: "starter", monthly: 29, yearly: 290 },
  { id: "professional", monthly: 79, yearly: 790, popular: true },
  { id: "enterprise", monthly: null, yearly: null },
];

const formatBytes = (mb: number): string => {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
};

function SubscriptionSection({
  subscription,
  onSelectPlan,
}: SubscriptionSectionProps) {
  const t = useTranslations("account.subscription");
  const tPlans = useTranslations("account.subscription.plans");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();
  const [cycle, setCycle] = useState<BillingCycle>(subscription.cycle);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );

  const renewsAt = useMemo(() => {
    const date = new Date(subscription.renewsAt);
    return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
  }, [subscription.renewsAt, dateFormatter]);

  const renderUsage = (
    label: string,
    value: SubscriptionLimit,
    formatter: (n: number) => string = (n) => n.toLocaleString(locale),
  ) => {
    const percent =
      value.limit && value.limit > 0
        ? Math.min(100, Math.round((value.used / value.limit) * 100))
        : 0;
    const barClass =
      percent >= 90
        ? "bg-error"
        : percent >= 70
          ? "bg-warning"
          : "bg-primary";

    return (
      <div className="rounded-lg border border-border-light p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{label}</span>
          <span className="font-medium text-text-primary">
            {formatter(value.used)}
            <span className="text-text-secondary font-normal">
              {" "}
              {value.limit === null
                ? `· ${t("unlimited")}`
                : t("ofLimit", { limit: formatter(value.limit) })}
            </span>
          </span>
        </div>
        {value.limit !== null && (
          <div className="mt-3 w-full bg-secondary-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${barClass} transition-all`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-primary-50 border border-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
            <Icon name="Sparkles" size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary font-medium">
              {t("currentPlan")}
            </p>
            <h3 className="text-lg font-semibold text-text-primary">
              {tPlans(subscription.planId)}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {subscription.trialEndsAt
                ? t("trialEndsOn", {
                    date: dateFormatter.format(
                      new Date(subscription.trialEndsAt),
                    ),
                  })
                : t("renewsOn", { date: renewsAt })}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          iconName="CreditCard"
        >
          {t("manageBilling")}
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-4">
          {t("usage")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderUsage(t("properties"), subscription.usage.properties)}
          {renderUsage(t("units"), subscription.usage.units)}
          {renderUsage(t("users"), subscription.usage.users)}
          {renderUsage(
            t("storage"),
            subscription.usage.storageMb,
            formatBytes,
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-medium text-text-primary">
            {t("downgrade")}
          </h3>
          <div className="inline-flex rounded-lg border border-border-light p-1 bg-secondary-50">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
                cycle === "monthly"
                  ? "bg-surface bg-white text-text-primary shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth flex items-center gap-1.5 ${
                cycle === "yearly"
                  ? "bg-surface bg-white text-text-primary shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              {t("yearly")}
              <span className="text-[10px] uppercase font-semibold text-success bg-success-50 px-1.5 py-0.5 rounded">
                {t("save", { percent: 16 })}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_CATALOG.map((plan) => {
            const price = cycle === "monthly" ? plan.monthly : plan.yearly;
            const isCurrent = subscription.planId === plan.id;
            const isEnterprise = price === null;

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-5 flex flex-col gap-4 ${
                  plan.popular
                    ? "border-primary shadow-card"
                    : "border-border-light"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 right-4 text-[10px] uppercase font-semibold bg-primary text-white px-2 py-0.5 rounded">
                    {tPlans("popularBadge")}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-text-primary">
                      {tPlans(plan.id)}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-semibold bg-success-50 text-success px-2 py-0.5 rounded">
                        {tPlans("currentBadge")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1 min-h-[2.5rem]">
                    {tPlans(`${plan.id}Desc`)}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  {isEnterprise ? (
                    <span className="text-xl font-semibold text-text-primary">
                      —
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-text-primary">
                        {formatCurrency(price as number, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {cycle === "monthly" ? t("perMonth") : t("perYear")}
                      </span>
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  variant={
                    isCurrent ? "outline" : plan.popular ? "primary" : "outline"
                  }
                  size="sm"
                  fullWidth
                  disabled={isCurrent}
                  onClick={() => onSelectPlan?.(plan.id, cycle)}
                  className={
                    !isCurrent && plan.popular ? "text-white" : undefined
                  }
                >
                  {isCurrent
                    ? tPlans("currentBadge")
                    : isEnterprise
                      ? tPlans("contactSales")
                      : tPlans("choose")}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionSection;
