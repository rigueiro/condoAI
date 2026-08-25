"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { AnnualBudget, BankAccount, Expense } from "@/types";
import { useCollections } from "@/lib/collections";
import {
  EMPTY_FINANCE,
  type DraftBudgetItem,
  type ExtraordinaryQuota,
  type FinanceState,
  type IssueExtraordinaryInput,
} from "./types";
import { buildDraftBudgetItems } from "./views";

interface FinanceContextValue {
  isReady: boolean;
  budgets: AnnualBudget[];
  expenses: Expense[];
  accounts: BankAccount[];
  extraordinaryQuotas: ExtraordinaryQuota[];
  draftItems: DraftBudgetItem[];
  upsertAnnualBudget: (budget: AnnualBudget) => void;
  removeAnnualBudget: (id: string) => void;
  markBudgetApproved: (id: string) => void;
  upsertExpenseRecord: (expense: Expense) => void;
  removeExpenseRecord: (id: string) => void;
  upsertBankAccount: (account: BankAccount) => void;
  removeBankAccount: (id: string) => void;
  issueExtraordinaryQuota: (
    input: IssueExtraordinaryInput,
  ) => Promise<{ ok: true } | { ok: false; code: string }>;
  refresh: () => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(
  undefined,
);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { portfolio } = usePortfolio();
  const { refresh: refreshCollections } = useCollections();

  const [state, setState] = useState<FinanceState>(EMPTY_FINANCE);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_FINANCE);
  }

  useEffect(() => {
    if (!email) return;
    const key = `${email}:${refreshNonce}`;
    if (loadedKey === key) return;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ state: FinanceState }>("/api/finance");
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_FINANCE);
        setLoadedKey(key);
      } finally {
        if (inFlightRef.current === key) {
          inFlightRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, loadedKey, refreshNonce]);

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_FINANCE);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchFinance = useCallback(async (body: Record<string, unknown>) => {
    try {
      const data = await apiFetch<{ state: FinanceState }>("/api/finance", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setState(data.state);
    } catch {
      /* keep current state */
    }
  }, []);

  const draftItems = useMemo(
    () => buildDraftBudgetItems(state.budgets, portfolio.condominiums),
    [state.budgets, portfolio.condominiums],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const issueExtraordinaryQuota = useCallback(
    async (input: IssueExtraordinaryInput) => {
      try {
        const data = await apiFetch<{ state: FinanceState }>("/api/finance", {
          method: "PATCH",
          body: JSON.stringify({ action: "issueExtraordinary", ...input }),
        });
        setState(data.state);
        refreshCollections();
        return { ok: true as const };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false as const, code };
      }
    },
    [refreshCollections],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      isReady,
      budgets: state.budgets,
      expenses: state.expenses,
      accounts: state.accounts,
      extraordinaryQuotas: state.extraordinaryQuotas ?? [],
      draftItems,
      upsertAnnualBudget: (budget) => {
        void patchFinance({ action: "upsertBudget", budget });
      },
      removeAnnualBudget: (id) => {
        void patchFinance({ action: "removeBudget", id });
      },
      markBudgetApproved: (id) => {
        void patchFinance({ action: "approveBudget", id });
      },
      upsertExpenseRecord: (expense) => {
        void patchFinance({ action: "upsertExpense", expense });
      },
      removeExpenseRecord: (id) => {
        void patchFinance({ action: "removeExpense", id });
      },
      upsertBankAccount: (account) => {
        void patchFinance({ action: "upsertAccount", account });
      },
      removeBankAccount: (id) => {
        void patchFinance({ action: "removeAccount", id });
      },
      issueExtraordinaryQuota,
      refresh,
    }),
    [
      isReady,
      state.budgets,
      state.expenses,
      state.accounts,
      state.extraordinaryQuotas,
      draftItems,
      patchFinance,
      issueExtraordinaryQuota,
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
