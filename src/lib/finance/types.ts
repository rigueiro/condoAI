import type { AnnualBudget, BankAccount, Expense } from "@/types";

export interface ExtraordinaryAllocation {
  ownerId: string;
  unitId: string;
  unitLabel: string;
  permillage: number;
  amount: number;
}

export interface ExtraordinaryQuota {
  id: string;
  condominiumId: string;
  date: string;
  dueDate: string;
  description: string;
  totalAmount: number;
  ownerCount: number;
  issuedAt: string;
  allocations: ExtraordinaryAllocation[];
}

export type IssueExtraordinaryInput = {
  condominiumId: string;
  description: string;
  totalAmount: number | string;
  date?: string;
  dueDate?: string;
};

export interface FinanceState {
  budgets: AnnualBudget[];
  expenses: Expense[];
  accounts: BankAccount[];
  extraordinaryQuotas: ExtraordinaryQuota[];
}

export const EMPTY_FINANCE: FinanceState = {
  budgets: [],
  expenses: [],
  accounts: [],
  extraordinaryQuotas: [],
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
  reserveShortfall: number;
};

export type FinanceTab = "attention" | FinanceKind | "extraordinary";
