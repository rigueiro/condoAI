"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { apiFetch } from "@/lib/api/client";
import { canPortal, type PortalBudget } from "@/lib/memberships";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";

type BudgetResponse = {
  budget: PortalBudget | null;
};

export default function PortalBudgetPage() {
  const t = useTranslations("portal");
  const { formatCurrency } = useFormatCurrency();
  const { condominiumId, selected } = usePortalCondo();
  const path =
    condominiumId && selected && canPortal(selected.role, "readBudget")
      ? `/api/portal/budget?condominiumId=${encodeURIComponent(condominiumId)}`
      : null;
  const { data, error, loading } = usePortalFetch<BudgetResponse>(path);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [localBudget, setLocalBudget] = useState<PortalBudget | null>(null);

  const budget = localBudget ?? data?.budget ?? null;

  const handleApprove = useCallback(async () => {
    if (!condominiumId || !budget || budget.status !== "draft") return;
    setApproving(true);
    setApproveError(null);
    try {
      const result = await apiFetch<{ budget: PortalBudget }>(
        "/api/portal/budget",
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "approveBudget",
            condominiumId,
            budgetId: budget.id,
          }),
        },
      );
      setLocalBudget(result.budget);
    } catch {
      setApproveError(t("budget.approveFailed"));
    } finally {
      setApproving(false);
    }
  }, [budget, condominiumId, t]);

  if (selected && !canPortal(selected.role, "readBudget")) {
    return (
      <PortalShell
        title={t("budget.title")}
        subtitle={t("budget.subtitle")}
      >
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("budget.unavailable")}
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell title={t("budget.title")} subtitle={t("budget.subtitle")}>
      {loading ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : !budget ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("budget.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border-light bg-surface px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                {t("budget.year", { year: budget.year })}
              </h2>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                  budget.status === "draft"
                    ? "bg-warning-50 text-warning"
                    : "bg-success-50 text-success"
                }`}
              >
                {budget.status === "draft"
                  ? t("budget.draft")
                  : t("budget.approved")}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-secondary">{t("budget.ordinaryTotal")}</dt>
                <dd className="font-medium text-text-primary">
                  {formatCurrency(budget.ordinaryTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t("budget.reserveFund")}</dt>
                <dd className="font-medium text-text-primary">
                  {formatCurrency(budget.reserveFund)}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t("budget.minimumReserve")}</dt>
                <dd className="font-medium text-text-primary">
                  {formatCurrency(budget.minimumReserve)}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t("budget.collectable")}</dt>
                <dd className="font-medium text-text-primary">
                  {formatCurrency(budget.collectable)}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">{t("budget.monthlyTotal")}</dt>
                <dd className="font-medium text-text-primary">
                  {formatCurrency(budget.monthlyTotal)}
                </dd>
              </div>
            </dl>

            {budget.shortfall > 0 && (
              <p className="mt-4 text-sm text-warning">{t("budget.shortfall")}</p>
            )}

            {budget.ordinary.length > 0 && (
              <div className="mt-5 border-t border-border-light pt-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  {t("budget.categories")}
                </h3>
                <ul className="mt-2 divide-y divide-border-light">
                  {budget.ordinary.map((line) => (
                    <li
                      key={line.key}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="capitalize text-text-secondary">
                        {line.key.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(line.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {budget.status === "draft" &&
              selected &&
              canPortal(selected.role, "approveBudget") && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-light pt-4">
                  <Button
                    iconName="Check"
                    onClick={handleApprove}
                    disabled={approving}
                  >
                    {approving ? t("budget.approving") : t("budget.approve")}
                  </Button>
                  {approveError && (
                    <p className="text-sm text-error">{approveError}</p>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
