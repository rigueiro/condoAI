import type { AnnualBudget } from "@/types";
import { roundCurrency, sumBudgetCategories } from "@/lib/quota";

/** Legal minimum: 10% of the ordinary (operating) annual budget. */
export const RESERVE_FUND_RATIO = 0.1;

const RESERVE_KEYS = new Set([
  "reserve",
  "reserva",
  "reservefund",
  "fundoreserva",
  "fundodereserva",
]);

function normalizeCategoryKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function isReserveCategoryKey(key: string): boolean {
  return RESERVE_KEYS.has(normalizeCategoryKey(key));
}

export type BudgetSummary = {
  ordinary: Record<string, number>;
  ordinaryTotal: number;
  reserveFund: number;
  minimumReserve: number;
  collectable: number;
  monthlyTotal: number;
  shortfall: number;
  hadReserveKeys: boolean;
};

function splitBudgetCategories(
  values: Record<string, number> | undefined,
): {
  ordinary: Record<string, number>;
  reserveFromCategories: number;
  hadReserveKeys: boolean;
} {
  const ordinary: Record<string, number> = {};
  let reserveFromCategories = 0;
  let hadReserveKeys = false;
  for (const [key, amount] of Object.entries(values ?? {})) {
    if (isReserveCategoryKey(key)) {
      hadReserveKeys = true;
      reserveFromCategories += Number(amount) || 0;
    } else {
      ordinary[key] = amount;
    }
  }
  return {
    ordinary,
    reserveFromCategories: roundCurrency(reserveFromCategories),
    hadReserveKeys,
  };
}

export function summarizeBudget(
  budget: Pick<AnnualBudget, "valuesByCategory"> & { reserveFund?: number },
): BudgetSummary {
  const { ordinary, reserveFromCategories, hadReserveKeys } =
    splitBudgetCategories(budget.valuesByCategory);
  const explicit = budget.reserveFund;
  const reserveFund =
    explicit != null && Number.isFinite(Number(explicit))
      ? roundCurrency(Number(explicit))
      : reserveFromCategories;
  const ordinaryTotal = roundCurrency(sumBudgetCategories(ordinary));
  const minimumReserve = roundCurrency(ordinaryTotal * RESERVE_FUND_RATIO);
  const collectable = roundCurrency(ordinaryTotal + reserveFund);
  return {
    ordinary,
    ordinaryTotal,
    reserveFund,
    minimumReserve,
    collectable,
    monthlyTotal: roundCurrency(collectable / 12),
    shortfall: roundCurrency(Math.max(0, minimumReserve - reserveFund)),
    hadReserveKeys,
  };
}

/** Pull legacy `reserve` category lines into `reserveFund` so they are not double-counted. */
export function normalizeAnnualBudget(budget: AnnualBudget): AnnualBudget {
  const summary = summarizeBudget(budget);
  if (!summary.hadReserveKeys && budget.reserveFund === summary.reserveFund) {
    return budget;
  }
  return {
    ...budget,
    valuesByCategory: summary.ordinary,
    reserveFund: summary.reserveFund,
  };
}

export function collectableBudgetTotal(budget: AnnualBudget): number {
  return summarizeBudget(budget).collectable;
}
