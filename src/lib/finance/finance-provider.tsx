"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import type { AnnualBudget, BankAccount, Expense } from "@/types";
import {
  approveBudget,
  loadFinance,
  removeAccount,
  removeBudget,
  removeExpense,
  upsertAccount,
  upsertBudget,
  upsertExpense,
  writeFinance,
} from "./storage";
import {
  EMPTY_FINANCE,
  type DraftBudgetItem,
  type FinanceState,
} from "./types";
import { buildDraftBudgetItems } from "./views";

interface FinanceContextValue {
  isReady: boolean;
  budgets: AnnualBudget[];
  expenses: Expense[];
  accounts: BankAccount[];
  draftItems: DraftBudgetItem[];
  upsertAnnualBudget: (budget: AnnualBudget) => void;
  removeAnnualBudget: (id: string) => void;
  markBudgetApproved: (id: string) => void;
  upsertExpenseRecord: (expense: Expense) => void;
  removeExpenseRecord: (id: string) => void;
  upsertBankAccount: (account: BankAccount) => void;
  removeBankAccount: (id: string) => void;
  refresh: () => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(
  undefined,
);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { isDemo, portfolio } = usePortfolio();

  const [state, setState] = useState<FinanceState>(EMPTY_FINANCE);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const loadKey = `${email ?? "anon"}:${isDemo ? "demo" : "live"}`;

  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    setState(email ? loadFinance(email, isDemo) : EMPTY_FINANCE);
  }

  const persist = useCallback(
    (updater: (prev: FinanceState) => FinanceState) => {
      setState((prev) => {
        const next = updater(prev);
        if (email) writeFinance(email, next);
        return next;
      });
    },
    [email],
  );

  const refresh = useCallback(() => {
    setState(email ? loadFinance(email, isDemo) : EMPTY_FINANCE);
  }, [email, isDemo]);

  const draftItems = useMemo(
    () => buildDraftBudgetItems(state.budgets, portfolio.condominiums),
    [state.budgets, portfolio.condominiums],
  );

  const upsertAnnualBudget = useCallback(
    (budget: AnnualBudget) => persist((prev) => upsertBudget(prev, budget)),
    [persist],
  );
  const removeAnnualBudget = useCallback(
    (id: string) => persist((prev) => removeBudget(prev, id)),
    [persist],
  );
  const markBudgetApproved = useCallback(
    (id: string) => persist((prev) => approveBudget(prev, id)),
    [persist],
  );
  const upsertExpenseRecord = useCallback(
    (expense: Expense) => persist((prev) => upsertExpense(prev, expense)),
    [persist],
  );
  const removeExpenseRecord = useCallback(
    (id: string) => persist((prev) => removeExpense(prev, id)),
    [persist],
  );
  const upsertBankAccount = useCallback(
    (account: BankAccount) => persist((prev) => upsertAccount(prev, account)),
    [persist],
  );
  const removeBankAccount = useCallback(
    (id: string) => persist((prev) => removeAccount(prev, id)),
    [persist],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      isReady: Boolean(email),
      budgets: state.budgets,
      expenses: state.expenses,
      accounts: state.accounts,
      draftItems,
      upsertAnnualBudget,
      removeAnnualBudget,
      markBudgetApproved,
      upsertExpenseRecord,
      removeExpenseRecord,
      upsertBankAccount,
      removeBankAccount,
      refresh,
    }),
    [
      email,
      state.budgets,
      state.expenses,
      state.accounts,
      draftItems,
      upsertAnnualBudget,
      removeAnnualBudget,
      markBudgetApproved,
      upsertExpenseRecord,
      removeExpenseRecord,
      upsertBankAccount,
      removeBankAccount,
      refresh,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return ctx;
}
