import { roundCurrency } from "@/lib/quota";
import { addCalendarMonths, daysBetween, isIsoDate, todayKey } from "./dates";
import {
  accountBalance,
  addChargeToState,
  formatAgreementNumber,
  issueReceipt,
  nextSequence,
  openDebtItems,
  quotaDueDate,
  yearFromDate,
} from "./ledger";
import type {
  AccountCharge,
  AccountReceipt,
  CollectionsState,
  CreateAgreementInput,
  PayInstallmentInput,
  PaymentAgreement,
  PaymentDetails,
} from "./types";
import type { QuotaPayment } from "@/types";

export const DEFAULT_MORA_RATE_ANNUAL = 4;
export const MAX_MORA_RATE_ANNUAL = 50;
export const MIN_INSTALLMENTS = 2;
export const MAX_INSTALLMENTS = 24;
export const INSTALLMENT_COUNTS = [2, 3, 4, 6, 8, 10, 12] as const;

export const AGREEMENT_ERROR_CODES = new Set([
  "alreadyActive",
  "noDebt",
  "invalidInstallments",
  "notActive",
  "hasPayments",
  "requestFailed",
]);

export type AgreementPreviewInstallment = {
  sequence: number;
  dueDate: string;
  amount: number;
};

export type AgreementPreview = {
  principal: number;
  moraDays: number;
  moraRateAnnual: number;
  moraAmount: number;
  total: number;
  oldestDue: string | null;
  quotaIds: string[];
  installments: AgreementPreviewInstallment[];
};

export type CreateAgreementResult = {
  state: CollectionsState;
  agreement: PaymentAgreement;
};

export type PayInstallmentResult = {
  state: CollectionsState;
  agreement: PaymentAgreement;
  receipt: AccountReceipt;
};

function parseCount(value: number | string): number {
  const count = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return Number.isFinite(count) ? count : NaN;
}

function parseRate(value: number | string | undefined): number {
  if (value == null || value === "") return DEFAULT_MORA_RATE_ANNUAL;
  const rate = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(rate) ? rate : NaN;
}

function openQuotaIds(ownerId: string, quotas: QuotaPayment[]): string[] {
  return quotas
    .filter(
      (quota) =>
        quota.ownerId === ownerId &&
        (quota.status === "pending" || quota.status === "overdue"),
    )
    .sort((a, b) =>
      quotaDueDate(a.monthYear).localeCompare(quotaDueDate(b.monthYear)),
    )
    .map((quota) => quota.id);
}

function putAgreement(
  state: CollectionsState,
  updated: PaymentAgreement,
  extra: Partial<Pick<CollectionsState, "charges" | "quotas" | "details">> = {},
): CollectionsState {
  return {
    ...state,
    ...extra,
    agreements: state.agreements.map((item) =>
      item.id === updated.id ? updated : item,
    ),
  };
}

export function splitInstallmentAmounts(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = roundCurrency(Math.floor((total / count) * 100) / 100);
  const amounts = Array.from({ length: count }, () => base);
  amounts[count - 1] = roundCurrency(total - base * (count - 1));
  return amounts;
}

export function moraAmountFor(
  principal: number,
  annualRate: number,
  days: number,
): number {
  if (principal <= 0 || annualRate <= 0 || days <= 0) return 0;
  return roundCurrency((principal * (annualRate / 100) * days) / 365);
}

export function remainingAgreementTotal(agreement: PaymentAgreement): number {
  return roundCurrency(
    agreement.installments
      .filter((item) => item.status !== "paid")
      .reduce((sum, item) => sum + item.amount, 0),
  );
}

export function activeAgreementForOwner(
  agreements: PaymentAgreement[],
  ownerId: string,
): PaymentAgreement | undefined {
  return agreements.find(
    (item) => item.ownerId === ownerId && item.status === "active",
  );
}

/** Active plan if any, otherwise the most recently created agreement. */
export function visibleAgreementForOwner(
  agreements: PaymentAgreement[],
  ownerId: string,
): PaymentAgreement | undefined {
  let latest: PaymentAgreement | undefined;
  let active: PaymentAgreement | undefined;
  for (const item of agreements) {
    if (item.ownerId !== ownerId) continue;
    if (item.status === "active") active = item;
    if (!latest || item.createdAt > latest.createdAt) latest = item;
  }
  return active ?? latest;
}

export function ownersOnActivePlan(
  agreements: PaymentAgreement[],
): Set<string> {
  const ids = new Set<string>();
  for (const item of agreements) {
    if (item.status === "active") ids.add(item.ownerId);
  }
  return ids;
}

export function activeCoveredQuotaIds(
  agreements: PaymentAgreement[],
): Set<string> {
  const ids = new Set<string>();
  for (const agreement of agreements) {
    if (agreement.status !== "active") continue;
    for (const quotaId of agreement.quotaIds) ids.add(quotaId);
  }
  return ids;
}

export function previewAgreement(
  ownerId: string,
  quotas: QuotaPayment[],
  charges: AccountCharge[],
  receipts: AccountReceipt[],
  input: {
    startDate: string;
    installmentCount: number;
    includeMora: boolean;
    moraRateAnnual: number;
  },
): AgreementPreview {
  const principal = accountBalance(ownerId, quotas, charges, receipts);
  const openItems = openDebtItems(ownerId, quotas, charges).filter(
    (item) => item.amount > 0,
  );
  const oldestDue = openItems[0]?.date ?? null;
  const moraDays =
    input.includeMora && oldestDue
      ? daysBetween(oldestDue, input.startDate)
      : 0;
  const moraRateAnnual = input.includeMora ? input.moraRateAnnual : 0;
  const moraAmount = input.includeMora
    ? moraAmountFor(principal, moraRateAnnual, moraDays)
    : 0;
  const total = roundCurrency(principal + moraAmount);

  return {
    principal,
    moraDays,
    moraRateAnnual,
    moraAmount,
    total,
    oldestDue,
    quotaIds: openQuotaIds(ownerId, quotas),
    installments: splitInstallmentAmounts(total, input.installmentCount).map(
      (amount, index) => ({
        sequence: index + 1,
        dueDate: addCalendarMonths(input.startDate, index),
        amount,
      }),
    ),
  };
}

function requirePreviewInput(
  input: CreateAgreementInput,
  today: string,
): {
  startDate: string;
  installmentCount: number;
  includeMora: boolean;
  moraRateAnnual: number;
  notes: string | null;
} {
  const startDate = input.startDate?.slice(0, 10) || today;
  if (!isIsoDate(startDate)) throw new Error("invalidDate");
  const installmentCount = parseCount(input.installmentCount);
  if (
    !Number.isInteger(installmentCount) ||
    installmentCount < MIN_INSTALLMENTS ||
    installmentCount > MAX_INSTALLMENTS
  ) {
    throw new Error("invalidInstallments");
  }
  const includeMora = Boolean(input.includeMora);
  const moraRateAnnual = includeMora ? parseRate(input.moraRateAnnual) : 0;
  if (
    includeMora &&
    (!Number.isFinite(moraRateAnnual) ||
      moraRateAnnual < 0 ||
      moraRateAnnual > MAX_MORA_RATE_ANNUAL)
  ) {
    throw new Error("invalidMoraRate");
  }
  return {
    startDate,
    installmentCount,
    includeMora,
    moraRateAnnual,
    notes: input.notes?.trim() || null,
  };
}

export function createAgreementInState(
  state: CollectionsState,
  input: CreateAgreementInput & { condominiumId: string },
  today = todayKey(),
): CreateAgreementResult {
  const ownerId = input.ownerId?.trim() ?? "";
  if (!ownerId) throw new Error("badRequest");
  if (activeAgreementForOwner(state.agreements, ownerId)) {
    throw new Error("alreadyActive");
  }

  const parsed = requirePreviewInput(input, today);
  const preview = previewAgreement(
    ownerId,
    state.quotas,
    state.charges,
    state.receipts,
    parsed,
  );
  if (preview.principal <= 0) throw new Error("noDebt");

  const year = yearFromDate(parsed.startDate);
  const sequenced = nextSequence(state.agreementSeqByYear, year);
  const number = formatAgreementNumber(year, sequenced.sequence);

  let next = { ...state, agreementSeqByYear: sequenced.seqByYear };
  let moraChargeId: string | null = null;
  if (preview.moraAmount > 0) {
    moraChargeId = crypto.randomUUID();
    next = addChargeToState(next, {
      id: moraChargeId,
      ownerId,
      condominiumId: input.condominiumId,
      date: parsed.startDate,
      kind: "mora",
      description: `Juros de mora — ${number}`,
      amount: preview.moraAmount,
    });
  }

  const agreement: PaymentAgreement = {
    id: crypto.randomUUID(),
    number,
    ownerId,
    condominiumId: input.condominiumId,
    createdAt: new Date().toISOString(),
    startDate: parsed.startDate,
    status: "active",
    principal: preview.principal,
    moraRateAnnual: preview.moraRateAnnual,
    moraAmount: preview.moraAmount,
    total: preview.total,
    installmentCount: parsed.installmentCount,
    notes: parsed.notes,
    quotaIds: preview.quotaIds,
    moraChargeId,
    installments: preview.installments.map((item) => ({
      id: crypto.randomUUID(),
      sequence: item.sequence,
      dueDate: item.dueDate,
      amount: item.amount,
      status: item.dueDate < today ? "overdue" : "pending",
      paidAt: null,
      receiptId: null,
    })),
    defaultedAt: null,
    completedAt: null,
    cancelledAt: null,
  };

  return {
    agreement,
    state: { ...next, agreements: [...next.agreements, agreement] },
  };
}

function requireActiveAgreement(
  state: CollectionsState,
  agreementId: string,
): PaymentAgreement {
  const agreement = state.agreements.find((item) => item.id === agreementId);
  if (!agreement) throw new Error("agreementNotFound");
  if (agreement.status !== "active") throw new Error("notActive");
  return agreement;
}

/** Mark covered quotas paid as cumulative plan receipts reach each amount. */
function allocatePlanReceipts(
  state: CollectionsState,
  agreement: PaymentAgreement,
  paymentDate: string,
  details: PaymentDetails,
): CollectionsState {
  const receiptIds = new Set(
    agreement.installments
      .map((item) => item.receiptId)
      .filter((id): id is string => Boolean(id)),
  );
  let remaining = roundCurrency(
    state.receipts
      .filter((receipt) => receiptIds.has(receipt.id))
      .reduce((sum, receipt) => sum + receipt.amount, 0),
  );

  const quotaById = new Map(state.quotas.map((quota) => [quota.id, quota]));
  const paidIds: string[] = [];
  for (const quotaId of agreement.quotaIds) {
    const quota = quotaById.get(quotaId);
    if (!quota || quota.status === "paid") continue;
    if (remaining + 0.001 < quota.amount) break;
    paidIds.push(quota.id);
    remaining = roundCurrency(remaining - quota.amount);
  }
  if (paidIds.length === 0) return state;

  const paid = new Set(paidIds);
  const nextDetails = { ...state.details };
  for (const id of paidIds) {
    nextDetails[id] = { ...nextDetails[id], ...details };
  }
  return {
    ...state,
    quotas: state.quotas.map((quota) =>
      paid.has(quota.id)
        ? { ...quota, status: "paid" as const, paymentDate }
        : quota,
    ),
    details: nextDetails,
  };
}

export function payInstallmentInState(
  state: CollectionsState,
  input: PayInstallmentInput,
  today = todayKey(),
): PayInstallmentResult {
  const agreement = requireActiveAgreement(state, input.agreementId);
  const installment = agreement.installments.find(
    (item) => item.id === input.installmentId,
  );
  if (!installment) throw new Error("installmentNotFound");
  if (installment.status === "paid") throw new Error("installmentPaid");

  const nextUnpaid = agreement.installments.find(
    (item) => item.status !== "paid",
  );
  if (!nextUnpaid || nextUnpaid.id !== installment.id) {
    throw new Error("installmentOutOfOrder");
  }

  const paymentDate = input.paymentDate?.slice(0, 10) || today;
  if (!isIsoDate(paymentDate)) throw new Error("invalidDate");

  const notes =
    input.notes?.trim() ||
    `${agreement.number} · ${installment.sequence}/${agreement.installments.length}`;
  const issued = issueReceipt(state, {
    ownerId: agreement.ownerId,
    condominiumId: agreement.condominiumId,
    date: paymentDate,
    amount: installment.amount,
    paymentMethod: input.paymentMethod ?? "Bank Transfer",
    notes,
    quotaId: null,
  });

  const installments = agreement.installments.map((item) =>
    item.id === installment.id
      ? {
          ...item,
          status: "paid" as const,
          paidAt: paymentDate,
          receiptId: issued.receipt.id,
        }
      : item,
  );
  const completed = installments.every((item) => item.status === "paid");
  const updated: PaymentAgreement = {
    ...agreement,
    installments,
    status: completed ? "completed" : "active",
    completedAt: completed ? new Date().toISOString() : null,
  };

  const next = allocatePlanReceipts(
    putAgreement(issued.state, updated),
    updated,
    paymentDate,
    {
      paymentMethod: issued.receipt.paymentMethod,
      receiptNumber: issued.receipt.number,
      notes,
      timestamp: new Date().toISOString(),
    },
  );

  return { state: next, agreement: updated, receipt: issued.receipt };
}

export function defaultAgreementInState(
  state: CollectionsState,
  agreementId: string,
): { state: CollectionsState; agreement: PaymentAgreement } {
  const agreement = requireActiveAgreement(state, agreementId);
  const updated: PaymentAgreement = {
    ...agreement,
    status: "defaulted",
    defaultedAt: new Date().toISOString(),
  };
  return { agreement: updated, state: putAgreement(state, updated) };
}

export function cancelAgreementInState(
  state: CollectionsState,
  agreementId: string,
): { state: CollectionsState; agreement: PaymentAgreement } {
  const agreement = requireActiveAgreement(state, agreementId);
  if (agreement.installments.some((item) => item.status === "paid")) {
    throw new Error("hasPayments");
  }

  const updated: PaymentAgreement = {
    ...agreement,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  };
  return {
    agreement: updated,
    state: putAgreement(state, updated, {
      charges: agreement.moraChargeId
        ? state.charges.filter((charge) => charge.id !== agreement.moraChargeId)
        : state.charges,
    }),
  };
}
