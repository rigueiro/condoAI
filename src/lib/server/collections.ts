import type { Owner, QuotaPayment } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  appendPaidQuota,
  findOpenQuota,
  markQuotaPaid,
  seedQuotasForOwners,
} from "@/lib/collections/storage";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import { monthYearFromDate, todayKey } from "@/lib/collections/dates";
import {
  EMPTY_COLLECTIONS,
  type AccountCharge,
  type AddChargeInput,
  type CollectionsState,
  type CreateAgreementInput,
  type IssueCertificateInput,
  type PayInstallmentInput,
  type PaymentDetails,
  type RecordPaymentInput,
} from "@/lib/collections/types";
import {
  addChargeToState,
  buildCertificateView,
  formatCertificateNumber,
  issueReceipt,
  nextSequence,
  normalizeLedger,
  parseChargeKind,
  yearFromDate,
  type CertificateView,
} from "@/lib/collections/ledger";
import { pickApprovedBudget } from "@/lib/reports/budget";
import { normalizeAnnualBudget } from "@/lib/finance/budget";
import {
  applyOrdinaryRun,
  isMonthYear,
  previewOrdinaryMonth,
  yearFromMonthYear,
  type IssueOrdinaryInput,
  type IssueOrdinaryResult,
} from "@/lib/collections/quota-run";
import {
  cancelAgreementInState,
  createAgreementInState,
  defaultAgreementInState,
  payInstallmentInState,
} from "@/lib/collections/agreement";
import { buildDemoCollections, buildDemoFinance } from "./demo";
import { getPortfolio } from "./portfolio";
import { readStore, writeStore } from "./store";

export type { AddChargeInput, IssueCertificateInput, RecordPaymentInput, CreateAgreementInput, PayInstallmentInput };

function normalizeCollections(parsed: CollectionsState): CollectionsState {
  return normalizeLedger(parsed);
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

/** Persist an already-mutated collections snapshot (transfer composes in memory). */
export function persistCollections(
  email: string,
  state: CollectionsState,
): CollectionsState {
  return saveCollections(email, state);
}

/** Read budgets without importing getFinance (circular with this module). */
function budgetsForWorkspace(email: string) {
  const key = email.trim().toLowerCase();
  const existing = readStore().finance[key];
  const finance =
    existing ?? (isDemoEmail(key) ? buildDemoFinance() : undefined);
  return (finance?.budgets ?? []).map(normalizeAnnualBudget);
}

function condominiumIdForOwner(email: string, ownerId: string): string {
  const portfolio = getPortfolio(email);
  return occupanciesForOwner(portfolio.units, ownerId)[0]?.unit.condominiumId ?? "";
}

/** Load collections. Skips portfolio lookup when quotas already exist. */
export function getCollections(email: string): CollectionsState {
  const key = email.trim().toLowerCase();
  const store = readStore();
  const existing = store.collections[key];

  if (existing?.quotas.length) {
    const next = normalizeCollections(existing);
    const needsWrite =
      next.receipts.length !== (existing.receipts?.length ?? 0) ||
      !existing.receiptSeqByYear ||
      !Array.isArray(existing.agreements);
    return needsWrite ? saveCollections(key, next) : next;
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
    ...current,
    quotas: current.quotas.filter((q) => q.id !== quotaId),
    details,
    receipts: current.receipts.map((receipt) =>
      receipt.quotaId === quotaId ? { ...receipt, quotaId: null } : receipt,
    ),
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
  const paidOn = input.paymentDate ?? todayKey();
  const condominiumId = condominiumIdForOwner(email, owner.id);

  const existingId =
    input.quotaId && state.quotas.some((q) => q.id === input.quotaId)
      ? input.quotaId
      : findOpenQuota(state.quotas, owner.id, amount)?.id;

  const issued = issueReceipt(state, {
    ownerId: owner.id,
    condominiumId,
    date: paidOn,
    amount,
    paymentMethod: input.paymentMethod ?? "Bank Transfer",
    notes: input.notes,
    quotaId: existingId ?? null,
  });

  const details: PaymentDetails = {
    paymentMethod: issued.receipt.paymentMethod,
    receiptNumber: issued.receipt.number,
    notes: input.notes,
    timestamp: new Date().toISOString(),
  };

  if (existingId) {
    const next = markQuotaPaid(issued.state, existingId, paidOn, details);
    return { quotaId: existingId, state: saveCollections(email, next) };
  }

  const newId = `pay-${crypto.randomUUID()}`;
  const withQuota = {
    ...issued.state,
    receipts: issued.state.receipts.map((receipt) =>
      receipt.id === issued.receipt.id
        ? { ...receipt, quotaId: newId }
        : receipt,
    ),
  };
  const next = appendPaidQuota(
    withQuota,
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

export function addCharge(
  email: string,
  input: AddChargeInput,
): CollectionsState {
  const amount =
    typeof input.amount === "string"
      ? parseFloat(input.amount)
      : input.amount;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("invalidAmount");
  }
  if (!input.ownerId) {
    throw new Error("badRequest");
  }

  const portfolio = getPortfolio(email);
  const owner = portfolio.owners.find((item) => item.id === input.ownerId);
  if (!owner) {
    throw new Error("notFound");
  }

  const kind = parseChargeKind(input.kind);
  const date = input.date?.slice(0, 10) || todayKey();
  const condominiumId =
    input.condominiumId || condominiumIdForOwner(email, owner.id);
  const description = input.description?.trim() || kind;

  const charge: AccountCharge = {
    id: crypto.randomUUID(),
    ownerId: owner.id,
    condominiumId,
    date,
    kind,
    description,
    amount,
  };

  return saveCollections(email, addChargeToState(getCollections(email), charge));
}

export function issueOrdinaryQuotas(
  email: string,
  input: IssueOrdinaryInput,
): { state: CollectionsState; result: IssueOrdinaryResult } {
  const condominiumId = input.condominiumId?.trim() ?? "";
  const monthYear = input.monthYear?.trim() ?? "";
  if (!condominiumId || !isMonthYear(monthYear)) {
    throw new Error("badRequest");
  }

  const portfolio = getPortfolio(email);
  const condo = portfolio.condominiums.find((item) => item.id === condominiumId);
  if (!condo) throw new Error("condominiumNotFound");

  const budget = pickApprovedBudget(
    budgetsForWorkspace(email),
    condominiumId,
    yearFromMonthYear(monthYear),
  );
  if (!budget) throw new Error("noApprovedBudget");

  const { rows } = previewOrdinaryMonth({
    units: portfolio.units,
    condominiumId,
    totalPermillage: condo.totalPermillage || 1000,
    budget,
  });
  if (rows.length === 0) throw new Error("noBilledOwners");

  const current = getCollections(email);
  const applied = applyOrdinaryRun(
    current.quotas,
    rows,
    condominiumId,
    monthYear,
  );
  if (applied.issued === 0) throw new Error("alreadyIssued");

  const state = saveCollections(email, { ...current, quotas: applied.quotas });
  return {
    state,
    result: {
      issued: applied.issued,
      skipped: applied.skipped,
      monthYear,
    },
  };
}

/** Append a certidão to collections in memory (caller persists). */
export function appendCertificate(
  state: CollectionsState,
  input: {
    owner: Owner;
    portfolio: ReturnType<typeof getPortfolio>;
    condominiumId: string;
    asOfDate: string;
  },
): { state: CollectionsState; view: CertificateView } {
  const year = yearFromDate(input.asOfDate);
  const sequenced = nextSequence(state.certificateSeqByYear, year);
  const draft = {
    id: crypto.randomUUID(),
    ownerId: input.owner.id,
    condominiumId: input.condominiumId,
    issuedAt: new Date().toISOString(),
    asOfDate: input.asOfDate,
    year,
    sequence: sequenced.sequence,
    number: formatCertificateNumber(year, sequenced.sequence),
    totalDue: 0,
  };
  const view = buildCertificateView(draft, {
    owner: input.owner,
    units: input.portfolio.units,
    condominiums: input.portfolio.condominiums,
    organization: input.portfolio.organization,
    quotas: state.quotas,
    charges: state.charges,
    receipts: state.receipts,
  });
  const certificate = { ...draft, totalDue: view.totalDue };
  return {
    state: {
      ...state,
      certificates: [...state.certificates, certificate],
      certificateSeqByYear: sequenced.seqByYear,
    },
    view: { ...view, certificate },
  };
}

export function issueCertificate(
  email: string,
  input: IssueCertificateInput,
) {
  if (!input.ownerId) {
    throw new Error("badRequest");
  }
  const portfolio = getPortfolio(email);
  const owner = portfolio.owners.find((item) => item.id === input.ownerId);
  if (!owner) {
    throw new Error("notFound");
  }

  const asOfDate = input.asOfDate?.slice(0, 10) || todayKey();
  const condominiumId =
    input.condominiumId || condominiumIdForOwner(email, owner.id);
  const appended = appendCertificate(getCollections(email), {
    owner,
    portfolio,
    condominiumId,
    asOfDate,
  });
  return { state: saveCollections(email, appended.state), view: appended.view };
}

function persistAgreementResult<T extends { state: CollectionsState }>(
  email: string,
  result: T,
): T {
  return { ...result, state: saveCollections(email, result.state) };
}

function ownerAndCondo(
  email: string,
  ownerId: string,
  condominiumId?: string,
) {
  const portfolio = getPortfolio(email);
  const owner = portfolio.owners.find((item) => item.id === ownerId);
  if (!owner) throw new Error("notFound");
  const resolved =
    condominiumId?.trim() || condominiumIdForOwner(email, owner.id);
  if (!resolved) throw new Error("condominiumNotFound");
  return { owner, condominiumId: resolved };
}

export function createPaymentAgreement(
  email: string,
  input: CreateAgreementInput,
) {
  if (!input.ownerId) throw new Error("badRequest");
  const { condominiumId } = ownerAndCondo(
    email,
    input.ownerId,
    input.condominiumId,
  );
  return persistAgreementResult(
    email,
    createAgreementInState(getCollections(email), {
      ...input,
      condominiumId,
    }),
  );
}

export function payAgreementInstallment(
  email: string,
  input: PayInstallmentInput,
) {
  if (!input.agreementId || !input.installmentId) throw new Error("badRequest");
  return persistAgreementResult(
    email,
    payInstallmentInState(getCollections(email), input),
  );
}

export function defaultPaymentAgreement(email: string, agreementId: string) {
  if (!agreementId) throw new Error("badRequest");
  return persistAgreementResult(
    email,
    defaultAgreementInState(getCollections(email), agreementId),
  );
}

export function cancelPaymentAgreement(email: string, agreementId: string) {
  if (!agreementId) throw new Error("badRequest");
  return persistAgreementResult(
    email,
    cancelAgreementInState(getCollections(email), agreementId),
  );
}
