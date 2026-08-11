import type { Owner, QuotaPayment } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  appendPaidQuota,
  findOpenQuota,
  markQuotaPaid,
  seedQuotasForOwners,
} from "@/lib/collections/storage";
import {
  EMPTY_COLLECTIONS,
  type CollectionsState,
  type PaymentDetails,
} from "@/lib/collections/types";
import { monthYearFromDate } from "@/lib/collections/dates";
import { getPortfolio } from "./portfolio";
import { buildDemoCollections } from "./demo";
import { readStore, writeStore } from "./store";

export type RecordPaymentInput = {
  ownerId: string;
  amount: number | string;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  quotaId?: string;
};

function normalizeCollections(parsed: CollectionsState): CollectionsState {
  return {
    quotas: Array.isArray(parsed.quotas) ? parsed.quotas : [],
    details:
      parsed.details && typeof parsed.details === "object"
        ? parsed.details
        : {},
  };
}

function saveCollections(
  email: string,
  state: CollectionsState,
): CollectionsState {
  const key = email.trim().toLowerCase();
  const next = normalizeCollections(state);
  const store = readStore();
  store.collections[key] = next;
  writeStore(store);
  return next;
}

/** Load collections. Skips portfolio lookup when quotas already exist. */
export function getCollections(email: string): CollectionsState {
  const key = email.trim().toLowerCase();
  const store = readStore();
  const existing = store.collections[key];

  if (existing?.quotas.length) {
    return normalizeCollections(existing);
  }

  if (isDemoEmail(key)) {
    return saveCollections(key, buildDemoCollections());
  }

  const owners = getPortfolio(key).owners;
  if (owners.length === 0) {
    if (existing) return normalizeCollections(existing);
    return saveCollections(key, { ...EMPTY_COLLECTIONS });
  }

  return saveCollections(key, seedQuotasForOwners(owners));
}

export function upsertQuota(
  email: string,
  quota: QuotaPayment,
): CollectionsState {
  const current = getCollections(email);
  const exists = current.quotas.some((q) => q.id === quota.id);
  const quotas = exists
    ? current.quotas.map((q) => (q.id === quota.id ? quota : q))
    : [...current.quotas, quota];
  return saveCollections(email, { ...current, quotas });
}

export function createQuota(
  email: string,
  quota: Omit<QuotaPayment, "id"> & { id?: string },
): CollectionsState {
  const id = quota.id ?? `quota-${crypto.randomUUID()}`;
  return upsertQuota(email, { ...quota, id });
}

export function deleteQuota(
  email: string,
  quotaId: string,
): CollectionsState {
  const current = getCollections(email);
  const { [quotaId]: _removed, ...details } = current.details;
  void _removed;
  return saveCollections(email, {
    quotas: current.quotas.filter((q) => q.id !== quotaId),
    details,
  });
}

export function recordPayment(
  email: string,
  input: RecordPaymentInput,
): { quotaId: string; state: CollectionsState } | null {
  const amount =
    typeof input.amount === "string"
      ? parseFloat(input.amount)
      : input.amount;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!input.ownerId) return null;

  const portfolio = getPortfolio(email);
  const owner = portfolio.owners.find((o: Owner) => o.id === input.ownerId);
  if (!owner) return null;

  const state = getCollections(email);
  const paidOn =
    input.paymentDate ?? new Date().toISOString().slice(0, 10);
  const details: PaymentDetails = {
    paymentMethod: input.paymentMethod ?? "Bank Transfer",
    receiptNumber: `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    notes: input.notes,
    timestamp: new Date().toISOString(),
  };

  const existingId =
    input.quotaId && state.quotas.some((q) => q.id === input.quotaId)
      ? input.quotaId
      : findOpenQuota(state.quotas, owner.id, amount)?.id;

  if (existingId) {
    const next = markQuotaPaid(state, existingId, paidOn, details);
    return { quotaId: existingId, state: saveCollections(email, next) };
  }

  const newId = `pay-${crypto.randomUUID()}`;
  const next = appendPaidQuota(
    state,
    {
      id: newId,
      ownerId: owner.id,
      monthYear: monthYearFromDate(new Date(paidOn)),
      amount,
      status: "paid",
      paymentDate: paidOn,
    },
    details,
  );
  return { quotaId: newId, state: saveCollections(email, next) };
}
