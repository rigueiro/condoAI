import type { Condominium, Owner, QuotaPayment, Unit } from "@/types";
import type { Organization } from "@/app/[locale]/account/types";
import { roundCurrency } from "@/lib/quota";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import type { OccupancyOnUnit } from "@/lib/portfolio/occupancy";
import type {
  AccountCharge,
  AccountReceipt,
  ChargeKind,
  CollectionsState,
  DebtCertificate,
  LedgerMovement,
} from "./types";

export const CHARGE_KINDS: ChargeKind[] = ["opening", "charge", "credit"];

const CHARGE_KIND_SET = new Set<string>(CHARGE_KINDS);

export function isChargeKind(value: string): value is ChargeKind {
  return CHARGE_KIND_SET.has(value);
}

export function parseChargeKind(value: string | undefined): ChargeKind {
  const kind = value ?? "";
  return isChargeKind(kind) ? kind : "charge";
}

export function quotaDueDate(monthYear: string): string {
  return `${monthYear}-08`;
}

function formatYearSequence(prefix: string, year: number, sequence: number) {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function formatReceiptNumber(year: number, sequence: number): string {
  return formatYearSequence("RCP", year, sequence);
}

export function formatCertificateNumber(
  year: number,
  sequence: number,
): string {
  return formatYearSequence("CD", year, sequence);
}

export function groupByOwnerId<T extends { ownerId: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.ownerId);
    if (list) list.push(item);
    else map.set(item.ownerId, [item]);
  }
  return map;
}

export function nextSequence(
  seqByYear: Record<string, number> | undefined,
  year: number,
): { sequence: number; seqByYear: Record<string, number> } {
  const current = seqByYear ?? {};
  const key = String(year);
  const sequence = (current[key] ?? 0) + 1;
  return { sequence, seqByYear: { ...current, [key]: sequence } };
}

export function yearFromDate(date: string): number {
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

export function emptyLedgerFields(): Pick<
  CollectionsState,
  | "charges"
  | "receipts"
  | "certificates"
  | "receiptSeqByYear"
  | "certificateSeqByYear"
> {
  return {
    charges: [],
    receipts: [],
    certificates: [],
    receiptSeqByYear: {},
    certificateSeqByYear: {},
  };
}

/** Fill ledger collections and backfill sequential receipts for paid quotas. */
export function normalizeLedger(state: CollectionsState): CollectionsState {
  const charges = Array.isArray(state.charges) ? state.charges : [];
  const receipts = Array.isArray(state.receipts) ? [...state.receipts] : [];
  const certificates = Array.isArray(state.certificates)
    ? state.certificates
    : [];
  let receiptSeqByYear =
    state.receiptSeqByYear && typeof state.receiptSeqByYear === "object"
      ? { ...state.receiptSeqByYear }
      : {};
  const certificateSeqByYear =
    state.certificateSeqByYear && typeof state.certificateSeqByYear === "object"
      ? { ...state.certificateSeqByYear }
      : {};
  const details =
    state.details && typeof state.details === "object"
      ? { ...state.details }
      : {};

  const covered = new Set(
    receipts.map((receipt) => receipt.quotaId).filter(Boolean),
  );
  const unpaidReceipts = (state.quotas ?? [])
    .filter(
      (quota) =>
        quota.status === "paid" &&
        quota.paymentDate &&
        !covered.has(quota.id),
    )
    .sort((a, b) =>
      String(a.paymentDate).localeCompare(String(b.paymentDate)),
    );

  for (const quota of unpaidReceipts) {
    const date = String(quota.paymentDate).slice(0, 10);
    const year = yearFromDate(date);
    const issued = nextSequence(receiptSeqByYear, year);
    receiptSeqByYear = issued.seqByYear;
    const number = formatReceiptNumber(year, issued.sequence);
    const receipt: AccountReceipt = {
      id: `rcpt-${quota.id}`,
      ownerId: quota.ownerId,
      condominiumId: "",
      date,
      amount: quota.amount,
      paymentMethod: details[quota.id]?.paymentMethod ?? "Bank Transfer",
      notes: details[quota.id]?.notes ?? null,
      year,
      sequence: issued.sequence,
      number,
      quotaId: quota.id,
    };
    receipts.push(receipt);
    details[quota.id] = {
      ...details[quota.id],
      receiptNumber: number,
    };
  }

  return {
    quotas: Array.isArray(state.quotas) ? state.quotas : [],
    details,
    charges,
    receipts,
    certificates,
    receiptSeqByYear,
    certificateSeqByYear,
  };
}

export function issueReceipt(
  state: CollectionsState,
  input: {
    ownerId: string;
    condominiumId: string;
    date: string;
    amount: number;
    paymentMethod: string;
    notes?: string | null;
    quotaId?: string | null;
  },
): { state: CollectionsState; receipt: AccountReceipt } {
  const year = yearFromDate(input.date);
  const issued = nextSequence(state.receiptSeqByYear, year);
  const receipt: AccountReceipt = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    condominiumId: input.condominiumId,
    date: input.date,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    notes: input.notes?.trim() || null,
    year,
    sequence: issued.sequence,
    number: formatReceiptNumber(year, issued.sequence),
    quotaId: input.quotaId ?? null,
  };
  return {
    receipt,
    state: {
      ...state,
      receipts: [...state.receipts, receipt],
      receiptSeqByYear: issued.seqByYear,
    },
  };
}

export function addChargeToState(
  state: CollectionsState,
  charge: AccountCharge,
): CollectionsState {
  return { ...state, charges: [...state.charges, charge] };
}

export function buildExtract(
  ownerId: string,
  quotas: QuotaPayment[],
  charges: AccountCharge[],
  receipts: AccountReceipt[],
  asOfDate?: string,
): LedgerMovement[] {
  const cutoff = asOfDate?.slice(0, 10);
  const rows: Omit<LedgerMovement, "balance">[] = [];

  for (const quota of quotas) {
    if (quota.ownerId !== ownerId) continue;
    const date = quotaDueDate(quota.monthYear);
    if (cutoff && date > cutoff) continue;
    rows.push({
      id: `quota-${quota.id}`,
      date,
      side: "debit",
      source: "quota",
      description: quota.monthYear,
      amount: quota.amount,
      quotaId: quota.id,
    });
  }

  for (const charge of charges) {
    if (charge.ownerId !== ownerId) continue;
    if (cutoff && charge.date > cutoff) continue;
    rows.push({
      id: `charge-${charge.id}`,
      date: charge.date,
      side: charge.kind === "credit" ? "credit" : "debit",
      source: "charge",
      description: charge.description,
      amount: charge.amount,
      chargeId: charge.id,
      chargeKind: charge.kind,
    });
  }

  for (const receipt of receipts) {
    if (receipt.ownerId !== ownerId) continue;
    if (cutoff && receipt.date > cutoff) continue;
    rows.push({
      id: `receipt-${receipt.id}`,
      date: receipt.date,
      side: "credit",
      source: "receipt",
      description: receipt.number,
      amount: receipt.amount,
      receiptNumber: receipt.number,
      receiptId: receipt.id,
      quotaId: receipt.quotaId ?? undefined,
    });
  }

  rows.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    if (a.side !== b.side) return a.side === "debit" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  let balance = 0;
  return rows.map((row) => {
    balance = roundCurrency(
      balance + (row.side === "debit" ? row.amount : -row.amount),
    );
    return { ...row, balance };
  });
}

export function closingBalance(movements: LedgerMovement[]): number {
  return movements.at(-1)?.balance ?? 0;
}

export function accountBalance(
  ownerId: string,
  quotas: QuotaPayment[],
  charges: AccountCharge[],
  receipts: AccountReceipt[],
  asOfDate?: string,
): number {
  return Math.max(
    0,
    closingBalance(buildExtract(ownerId, quotas, charges, receipts, asOfDate)),
  );
}

export function previewDebt(
  ownerId: string,
  quotas: QuotaPayment[],
  charges: AccountCharge[],
  receipts: AccountReceipt[],
  asOfDate?: string,
) {
  return {
    items: openDebtItems(ownerId, quotas, charges, asOfDate),
    total: accountBalance(ownerId, quotas, charges, receipts, asOfDate),
  };
}

export type CertificateOpenItem = {
  date: string;
  description: string;
  amount: number;
  source: LedgerMovement["source"];
};

export function openDebtItems(
  ownerId: string,
  quotas: QuotaPayment[],
  charges: AccountCharge[],
  asOfDate?: string,
): CertificateOpenItem[] {
  const cutoff = asOfDate?.slice(0, 10);
  const items: CertificateOpenItem[] = [];

  for (const quota of quotas) {
    if (quota.ownerId !== ownerId) continue;
    const due = quotaDueDate(quota.monthYear);
    if (cutoff && due > cutoff) continue;
    const paidOn = quota.paymentDate
      ? String(quota.paymentDate).slice(0, 10)
      : null;
    const paidByCutoff =
      quota.status === "paid" && paidOn && (!cutoff || paidOn <= cutoff);
    if (paidByCutoff) continue;
    items.push({
      date: due,
      description: quota.monthYear,
      amount: quota.amount,
      source: "quota",
    });
  }

  for (const charge of charges) {
    if (charge.ownerId !== ownerId) continue;
    if (cutoff && charge.date > cutoff) continue;
    items.push({
      date: charge.date,
      description: charge.description,
      amount: charge.kind === "credit" ? -charge.amount : charge.amount,
      source: "charge",
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export type CertificateView = {
  certificate: DebtCertificate;
  owner: Owner;
  occupancies: OccupancyOnUnit[];
  condominium: Condominium | undefined;
  organization: Organization | null;
  openItems: CertificateOpenItem[];
  totalDue: number;
};

export function buildCertificateView(
  certificate: DebtCertificate,
  input: {
    owner: Owner;
    units: Unit[];
    condominiums: Condominium[];
    organization: Organization | null;
    quotas: QuotaPayment[];
    charges: AccountCharge[];
    receipts?: AccountReceipt[];
  },
): CertificateView {
  const occupancies = occupanciesForOwner(input.units, input.owner.id);
  const condominium =
    input.condominiums.find((c) => c.id === certificate.condominiumId) ??
    (occupancies[0]
      ? input.condominiums.find(
          (c) => c.id === occupancies[0].unit.condominiumId,
        )
      : undefined);
  const { items: openItems, total: totalDue } = previewDebt(
    input.owner.id,
    input.quotas,
    input.charges,
    input.receipts ?? [],
    certificate.asOfDate,
  );

  return {
    certificate: { ...certificate, totalDue },
    owner: input.owner,
    occupancies,
    condominium,
    organization: input.organization,
    openItems,
    totalDue,
  };
}
