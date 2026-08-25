import type { AnnualBudget, BankAccount, Expense } from "@/types";
import type { ExtraordinaryQuota, FinanceState } from "./types";

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

export function appendExtraordinary(
  state: FinanceState,
  item: ExtraordinaryQuota,
): FinanceState {
  return {
    ...state,
    extraordinaryQuotas: [item, ...(state.extraordinaryQuotas ?? [])],
  };
}
