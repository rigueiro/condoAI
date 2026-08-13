import type { AnnualBudget, BankAccount, Expense } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  approveBudget,
  removeAccount,
  removeBudget,
  removeExpense,
  upsertAccount,
  upsertBudget,
  upsertExpense,
} from "@/lib/finance/storage";
import { EMPTY_FINANCE, type FinanceState } from "@/lib/finance/types";
import { buildDemoFinance } from "./demo";
import { readStore, writeStore } from "./store";

function normalizeFinance(parsed: FinanceState): FinanceState {
  return {
    budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
  };
}

function loadOrSeedFinance(email: string): {
  key: string;
  state: FinanceState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().finance[key];
  if (existing) {
    return { key, state: normalizeFinance(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoFinance(), seeded: true };
  }
  return { key, state: { ...EMPTY_FINANCE }, seeded: false };
}

/** Load finance. Seeds demo fixtures when missing. */
export function getFinance(email: string): FinanceState {
  const { key, state, seeded } = loadOrSeedFinance(email);
  if (seeded) {
    const store = readStore();
    store.finance[key] = state;
    writeStore(store);
  }
  return state;
}

/** Single read→mutate→write, including first-touch demo seed. */
function mutateFinance(
  email: string,
  mutator: (current: FinanceState) => FinanceState,
): FinanceState {
  const { key, state } = loadOrSeedFinance(email);
  const next = normalizeFinance(mutator(state));
  const store = readStore();
  store.finance[key] = next;
  writeStore(store);
  return next;
}

export function putBudget(email: string, budget: AnnualBudget): FinanceState {
  return mutateFinance(email, (current) => upsertBudget(current, budget));
}

export function deleteBudget(email: string, id: string): FinanceState {
  return mutateFinance(email, (current) => removeBudget(current, id));
}

export function markBudgetApproved(email: string, id: string): FinanceState {
  return mutateFinance(email, (current) => approveBudget(current, id));
}

export function putExpense(email: string, expense: Expense): FinanceState {
  return mutateFinance(email, (current) => upsertExpense(current, expense));
}

export function deleteExpense(email: string, id: string): FinanceState {
  return mutateFinance(email, (current) => removeExpense(current, id));
}

export function putAccount(email: string, account: BankAccount): FinanceState {
  return mutateFinance(email, (current) => upsertAccount(current, account));
}

export function deleteAccount(email: string, id: string): FinanceState {
  return mutateFinance(email, (current) => removeAccount(current, id));
}
