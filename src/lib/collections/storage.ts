import { mockQuotaPayments } from "@/fixtures/domain";
import type { Owner, QuotaPayment } from "@/types";
import { monthYearFromDate, previousMonthYear } from "./dates";
import {
  EMPTY_COLLECTIONS,
  type CollectionsState,
  type PaymentDetails,
} from "./types";

const STORAGE_PREFIX = "condoai.collections.";

const isBrowser = (): boolean => typeof window !== "undefined";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

/** Seed pending/overdue quotas for onboarded portfolios with no history yet. */
export function seedQuotasForOwners(
  owners: Owner[],
  now = new Date(),
): CollectionsState {
  const prev = previousMonthYear(now);
  const current = monthYearFromDate(now);
  const prevStatus = now.getDate() >= 8 ? ("overdue" as const) : ("pending" as const);

  const quotas = owners.flatMap((owner) => [
    {
      id: `seed-${owner.id}-${prev}`,
      ownerId: owner.id,
      monthYear: prev,
      amount: owner.monthlyQuota,
      status: prevStatus,
      paymentDate: null,
    },
    {
      id: `seed-${owner.id}-${current}`,
      ownerId: owner.id,
      monthYear: current,
      amount: owner.monthlyQuota,
      status: "pending" as const,
      paymentDate: null,
    },
  ]);
  return { quotas, details: {} };
}

export function defaultCollections(
  isDemo: boolean,
  owners: Owner[],
): CollectionsState {
  if (isDemo) {
    return {
      quotas: mockQuotaPayments.map((q) => ({ ...q })),
      details: {},
    };
  }
  if (owners.length === 0) return { ...EMPTY_COLLECTIONS };
  return seedQuotasForOwners(owners);
}

export function readCollections(email: string): CollectionsState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CollectionsState;
    return {
      quotas: Array.isArray(parsed.quotas) ? parsed.quotas : [],
      details:
        parsed.details && typeof parsed.details === "object"
          ? parsed.details
          : {},
    };
  } catch {
    window.localStorage.removeItem(storageKey(email));
    return null;
  }
}

export function writeCollections(
  email: string,
  state: CollectionsState,
): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(state));
}

export function loadCollections(
  email: string,
  isDemo: boolean,
  owners: Owner[],
): CollectionsState {
  const stored = readCollections(email);
  if (stored && (stored.quotas.length > 0 || (!isDemo && owners.length === 0))) {
    return stored;
  }

  const seeded = defaultCollections(isDemo, owners);
  writeCollections(email, seeded);
  return seeded;
}

function withDetails(
  state: CollectionsState,
  quotaId: string,
  details?: PaymentDetails,
): Record<string, PaymentDetails> {
  if (!details) return state.details;
  return {
    ...state.details,
    [quotaId]: { ...state.details[quotaId], ...details },
  };
}

export function markQuotaPaid(
  state: CollectionsState,
  quotaId: string,
  paymentDate: string,
  details?: PaymentDetails,
): CollectionsState {
  return {
    quotas: state.quotas.map((q) =>
      q.id === quotaId ? { ...q, status: "paid" as const, paymentDate } : q,
    ),
    details: withDetails(state, quotaId, details),
  };
}

export function appendPaidQuota(
  state: CollectionsState,
  quota: QuotaPayment,
  details?: PaymentDetails,
): CollectionsState {
  return {
    quotas: [quota, ...state.quotas],
    details: withDetails(state, quota.id, details),
  };
}

export function findOpenQuota(
  quotas: QuotaPayment[],
  ownerId: string,
  amount?: number,
): QuotaPayment | undefined {
  const open = quotas.filter(
    (q) =>
      q.ownerId === ownerId &&
      (q.status === "overdue" || q.status === "pending"),
  );
  if (amount != null && Number.isFinite(amount)) {
    const exact = open.find((q) => Math.abs(q.amount - amount) < 0.01);
    if (exact) return exact;
  }
  return open[0];
}
