import type {
  AnnualBudget,
  BankAccount,
  Condominium,
  Expense,
  QuotaPayment,
  Unit,
} from "@/types";
import { roundCurrency } from "@/lib/quota";
import { summarizeBudget } from "@/lib/finance/budget";
import type { ExtraordinaryQuota } from "@/lib/finance/types";
import { pickBudget } from "./budget";
import type { CategoryAmount, PrestacaoReport } from "./types";

const EMPTY_BUDGET = summarizeBudget({
  valuesByCategory: {},
  reserveFund: 0,
});

function yearFromDate(date: Date | string): number {
  const year = Number(String(date).slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function sortCategoryAmounts(items: CategoryAmount[]): CategoryAmount[] {
  return [...items].sort(
    (a, b) => b.amount - a.amount || a.category.localeCompare(b.category),
  );
}

function groupExpenseAmounts(expenses: Expense[]): {
  byCategory: CategoryAmount[];
  total: number;
} {
  const map = new Map<string, number>();
  let total = 0;
  for (const expense of expenses) {
    const key = expense.category.trim() || "other";
    map.set(key, roundCurrency((map.get(key) ?? 0) + expense.amount));
    total = roundCurrency(total + expense.amount);
  }
  return {
    byCategory: sortCategoryAmounts(
      [...map.entries()].map(([category, amount]) => ({ category, amount })),
    ),
    total,
  };
}

function ownerIdsForCondo(units: Unit[], condominiumId: string): Set<string> {
  const ids = new Set<string>();
  for (const unit of units) {
    if (unit.condominiumId !== condominiumId) continue;
    for (const occ of unit.occupancies ?? []) ids.add(occ.ownerId);
  }
  return ids;
}

export function buildPrestacaoReport(input: {
  condominium: Condominium;
  year: number;
  budgets: AnnualBudget[];
  expenses: Expense[];
  accounts: BankAccount[];
  extraordinaryQuotas: ExtraordinaryQuota[];
  quotas: QuotaPayment[];
  units: Unit[];
}): PrestacaoReport {
  const {
    condominium,
    year,
    budgets,
    expenses,
    accounts,
    extraordinaryQuotas,
    quotas,
    units,
  } = input;

  const budget = pickBudget(budgets, condominium.id, year);
  const summary = budget ? summarizeBudget(budget) : EMPTY_BUDGET;

  const ordinary = sortCategoryAmounts(
    Object.entries(summary.ordinary).map(([category, amount]) => ({
      category,
      amount,
    })),
  );

  const yearExpenses = expenses.filter(
    (e) => e.condominiumId === condominium.id && yearFromDate(e.date) === year,
  );
  const { byCategory: expensesByCategory, total: expenseTotal } =
    groupExpenseAmounts(yearExpenses);

  const bankAccounts = accounts
    .filter((a) => a.condominiumId === condominium.id)
    .map((a) => ({
      bank: a.bank,
      iban: a.iban,
      balance: a.currentBalance,
    }));
  const bankTotal = roundCurrency(
    bankAccounts.reduce((sum, a) => sum + a.balance, 0),
  );

  const extraordinary = extraordinaryQuotas
    .filter(
      (q) =>
        q.condominiumId === condominium.id && yearFromDate(q.date) === year,
    )
    .map((q) => ({
      id: q.id,
      description: q.description,
      date: q.date,
      totalAmount: q.totalAmount,
      ownerCount: q.ownerCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const extraordinaryTotal = roundCurrency(
    extraordinary.reduce((sum, q) => sum + q.totalAmount, 0),
  );

  const ownerIds = ownerIdsForCondo(units, condominium.id);
  const yearPrefix = `${year}-`;
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let paidAmount = 0;
  let outstandingAmount = 0;
  for (const quota of quotas) {
    if (!ownerIds.has(quota.ownerId)) continue;
    if (!quota.monthYear.startsWith(yearPrefix)) continue;
    if (quota.status === "paid") {
      paid += 1;
      paidAmount += quota.amount;
    } else if (quota.status === "overdue") {
      overdue += 1;
      outstandingAmount += quota.amount;
    } else {
      pending += 1;
      outstandingAmount += quota.amount;
    }
  }

  return {
    condominiumId: condominium.id,
    condominiumName: condominium.name,
    year,
    budgetStatus: budget?.status ?? null,
    ordinary,
    ordinaryTotal: summary.ordinaryTotal,
    reserveFund: summary.reserveFund,
    minimumReserve: summary.minimumReserve,
    collectable: summary.collectable,
    expensesByCategory,
    expenseTotal,
    variance: roundCurrency(summary.ordinaryTotal - expenseTotal),
    bankAccounts,
    bankTotal,
    extraordinary,
    extraordinaryTotal,
    quotas: {
      paid,
      pending,
      overdue,
      paidAmount: roundCurrency(paidAmount),
      outstandingAmount: roundCurrency(outstandingAmount),
    },
  };
}
