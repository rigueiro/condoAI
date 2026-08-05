import {
  mockAnnualBudgets,
  mockBankAccounts,
  mockExpenses,
} from "@/fixtures/domain";
import type { AnnualBudget, BankAccount, Expense } from "@/types";
import { EMPTY_FINANCE, type FinanceState } from "./types";

const STORAGE_PREFIX = "condoai.finance.";

const isBrowser = (): boolean => typeof window !== "undefined";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function cloneList<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

function cloneBudgets(items: AnnualBudget[]): AnnualBudget[] {
  return items.map((b) => ({
    ...b,
    valuesByCategory: { ...b.valuesByCategory },
  }));
}

export function defaultFinance(isDemo: boolean): FinanceState {
  if (!isDemo) return { ...EMPTY_FINANCE };
  return {
    budgets: cloneBudgets(mockAnnualBudgets),
    expenses: cloneList(mockExpenses),
    accounts: cloneList(mockBankAccounts),
  };
}

export function readFinance(email: string): FinanceState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinanceState;
    return {
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    };
  } catch {
    window.localStorage.removeItem(storageKey(email));
    return null;
  }
}

export function writeFinance(email: string, state: FinanceState): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(state));
}

export function loadFinance(email: string, isDemo: boolean): FinanceState {
  const stored = readFinance(email);
  if (stored) return stored;

  const seeded = defaultFinance(isDemo);
  writeFinance(email, seeded);
  return seeded;
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((i) => i.id !== id);
}

function withList<K extends "budgets" | "expenses" | "accounts">(
  state: FinanceState,
  key: K,
  updater: (items: FinanceState[K]) => FinanceState[K],
): FinanceState {
  return { ...state, [key]: updater(state[key]) };
}

export function upsertBudget(
  state: FinanceState,
  budget: AnnualBudget,
): FinanceState {
  return withList(state, "budgets", (items) => upsertById(items, budget));
}

export function removeBudget(state: FinanceState, id: string): FinanceState {
  return withList(state, "budgets", (items) => removeById(items, id));
}

export function upsertExpense(
  state: FinanceState,
  expense: Expense,
): FinanceState {
  return withList(state, "expenses", (items) => upsertById(items, expense));
}

export function removeExpense(state: FinanceState, id: string): FinanceState {
  return withList(state, "expenses", (items) => removeById(items, id));
}

export function upsertAccount(
  state: FinanceState,
  account: BankAccount,
): FinanceState {
  return withList(state, "accounts", (items) => upsertById(items, account));
}

export function removeAccount(state: FinanceState, id: string): FinanceState {
  return withList(state, "accounts", (items) => removeById(items, id));
}

/** Move a draft annual budget to approved. */
export function approveBudget(
  state: FinanceState,
  id: string,
): FinanceState {
  return withList(state, "budgets", (items) =>
    items.map((b) =>
      b.id === id ? { ...b, status: "approved" as const } : b,
    ),
  );
}
