import type { AnnualBudget, BankAccount, Expense } from "@/types";

export interface FinanceState {
  budgets: AnnualBudget[];
  expenses: Expense[];
  accounts: BankAccount[];
}

export const EMPTY_FINANCE: FinanceState = {
  budgets: [],
  expenses: [],
  accounts: [],
};

export type FinanceKind = "budget" | "expense" | "bank";

/** Draft budget waiting on assembly approval. */
export type DraftBudgetItem = {
  id: string;
  condominiumId: string;
  condominiumName: string;
  year: number;
  total: number;
  categoryCount: number;
};

export type FinanceTab = "attention" | FinanceKind;
