import type { AnnualBudget } from "@/types";

/** Prefer approved budget for condo+year; otherwise the first match. */
export function pickBudget(
  budgets: AnnualBudget[],
  condominiumId: string,
  year: number,
): AnnualBudget | undefined {
  let fallback: AnnualBudget | undefined;
  for (const budget of budgets) {
    if (budget.condominiumId !== condominiumId || budget.year !== year) continue;
    if (budget.status === "approved") return budget;
    fallback ??= budget;
  }
  return fallback;
}

/** Approved budget for condo+year, or undefined. */
export function pickApprovedBudget(
  budgets: AnnualBudget[],
  condominiumId: string,
  year: number,
): AnnualBudget | undefined {
  const budget = pickBudget(budgets, condominiumId, year);
  return budget?.status === "approved" ? budget : undefined;
}

export function availableBudgetYears(
  budgets: AnnualBudget[],
  condominiumId: string,
): number[] {
  const years = new Set<number>();
  for (const budget of budgets) {
    if (budget.condominiumId === condominiumId) years.add(budget.year);
  }
  return [...years].sort((a, b) => b - a);
}

export function budgetStatusKey(
  status: "draft" | "approved" | null | undefined,
): "approved" | "draft" | "missing" {
  if (status === "approved" || status === "draft") return status;
  return "missing";
}
