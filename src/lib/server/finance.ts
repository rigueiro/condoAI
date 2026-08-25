import type { AnnualBudget, BankAccount, Expense } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import { roundCurrency } from "@/lib/quota";
import { todayKey } from "@/lib/collections/dates";
import type { AccountCharge } from "@/lib/collections/types";
import {
  addChargesToState,
  normalizeLedger,
} from "@/lib/collections/ledger";
import { normalizeAnnualBudget } from "@/lib/finance/budget";
import {
  allocateExtraordinary,
  groupAllocationsByOwner,
  ownerCountFromAllocations,
} from "@/lib/finance/extraordinary";
import {
  appendExtraordinary,
  approveBudget,
  removeAccount,
  removeBudget,
  removeExpense,
  upsertAccount,
  upsertBudget,
  upsertExpense,
} from "@/lib/finance/storage";
import {
  EMPTY_FINANCE,
  type ExtraordinaryQuota,
  type FinanceState,
  type IssueExtraordinaryInput,
} from "@/lib/finance/types";
import { getCollections } from "./collections";
import { buildDemoFinance } from "./demo";
import { getPortfolio } from "./portfolio";
import { readStore, updateStore, writeStore } from "./store";

function normalizeExtraordinary(item: ExtraordinaryQuota): ExtraordinaryQuota {
  const allocations = Array.isArray(item.allocations) ? item.allocations : [];
  const totalAmount = Number(item.totalAmount) || 0;
  const ownerCount =
    typeof item.ownerCount === "number"
      ? item.ownerCount
      : ownerCountFromAllocations(allocations);
  if (
    allocations === item.allocations &&
    item.totalAmount === totalAmount &&
    item.ownerCount === ownerCount
  ) {
    return item;
  }
  return { ...item, allocations, totalAmount, ownerCount };
}

function normalizeFinance(parsed: FinanceState): FinanceState {
  return {
    budgets: Array.isArray(parsed.budgets)
      ? parsed.budgets.map(normalizeAnnualBudget)
      : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    extraordinaryQuotas: Array.isArray(parsed.extraordinaryQuotas)
      ? parsed.extraordinaryQuotas.map(normalizeExtraordinary)
      : [],
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

function chargesFromGroupedOwners(
  grouped: { ownerId: string; amount: number }[],
  condominiumId: string,
  date: string,
  description: string,
): AccountCharge[] {
  return grouped.map(({ ownerId, amount }) => ({
    id: crypto.randomUUID(),
    ownerId,
    condominiumId,
    date,
    kind: "extraordinary" as const,
    description,
    amount,
  }));
}

export function issueExtraordinaryQuota(
  email: string,
  input: IssueExtraordinaryInput,
): FinanceState {
  const description = input.description?.trim() ?? "";
  const condominiumId = input.condominiumId?.trim() ?? "";
  const totalAmount =
    typeof input.totalAmount === "string"
      ? parseFloat(input.totalAmount)
      : input.totalAmount;

  if (!condominiumId || !description) {
    throw new Error("badRequest");
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("invalidAmount");
  }

  const key = email.trim().toLowerCase();
  const portfolio = getPortfolio(email);
  if (!portfolio.condominiums.some((item) => item.id === condominiumId)) {
    throw new Error("condominiumNotFound");
  }

  const amount = roundCurrency(totalAmount);
  const date = input.date?.slice(0, 10) || todayKey();
  const dueDate = input.dueDate?.slice(0, 10) || date;
  const ownerIds = new Set(portfolio.owners.map((owner) => owner.id));
  const allocations = allocateExtraordinary(
    portfolio.units,
    condominiumId,
    amount,
    ownerIds,
  );
  const charges = chargesFromGroupedOwners(
    groupAllocationsByOwner(allocations),
    condominiumId,
    date,
    description,
  );
  if (charges.length === 0) {
    throw new Error("noBilledOwners");
  }

  const extra: ExtraordinaryQuota = {
    id: crypto.randomUUID(),
    condominiumId,
    date,
    dueDate,
    description,
    totalAmount: amount,
    ownerCount: ownerCountFromAllocations(allocations),
    issuedAt: new Date().toISOString(),
    allocations,
  };

  const collections = getCollections(email);
  const finance = getFinance(email);
  const nextCollections = normalizeLedger(
    addChargesToState(collections, charges),
  );
  const nextFinance = normalizeFinance(appendExtraordinary(finance, extra));

  updateStore((store) => {
    store.collections[key] = nextCollections;
    store.finance[key] = nextFinance;
  });
  return nextFinance;
}
