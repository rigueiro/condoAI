import type { QuotaPayment } from "@/types";
import type { PaymentView } from "@/fixtures/views";
import type {
  OwnerRow,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import type { Portfolio } from "@/lib/portfolio/types";
import { ownerDisplay, portfolioToOwnerRows } from "@/lib/portfolio/mappers";
import type {
  AccountCharge,
  AccountReceipt,
  OverdueItem,
  PaymentAgreement,
  PaymentDetails,
} from "./types";
import { buildExtract, closingBalance, groupByOwnerId, quotaDueDate } from "./ledger";
import { activeCoveredQuotaIds, ownersOnActivePlan } from "./agreement";

const QUOTA_TO_PAYMENT_STATUS: Record<
  QuotaPayment["status"],
  PaymentView["status"]
> = {
  paid: "completed",
  pending: "pending",
  overdue: "failed",
};

/** Payment history row with stable quota id for mutations. */
export type PaymentRow = PaymentView & { quotaId: string };

function deriveStatus(
  quotas: QuotaPayment[],
): Pick<OwnerRow, "paymentStatus" | "lastPayment"> {
  let hasOverdue = false;
  let hasPending = false;
  let lastPayment = "";

  for (const q of quotas) {
    if (q.status === "overdue") hasOverdue = true;
    else if (q.status === "pending") hasPending = true;
    else if (q.status === "paid" && q.paymentDate) {
      const paid = String(q.paymentDate).slice(0, 10);
      if (!lastPayment || paid > lastPayment) lastPayment = paid;
    }
  }

  const paymentStatus: PaymentStatus = hasOverdue
    ? "overdue"
    : hasPending
      ? "pending"
      : quotas.length > 0
        ? "current"
        : "";

  return { paymentStatus, lastPayment };
}

function portfolioLookup(portfolio: Portfolio) {
  return {
    ownerById: new Map(portfolio.owners.map((o) => [o.id, o])),
    condoById: new Map(portfolio.condominiums.map((c) => [c.id, c])),
  };
}

export function quotasToPaymentRows(
  quotas: QuotaPayment[],
  portfolio: Portfolio,
  details: Record<string, PaymentDetails>,
): PaymentRow[] {
  const { ownerById, condoById } = portfolioLookup(portfolio);

  return quotas.map((quota, index) => {
    const owner = ownerById.get(quota.ownerId);
    const display = owner
      ? ownerDisplay(portfolio, owner, condoById)
      : undefined;
    const date =
      quota.paymentDate != null
        ? String(quota.paymentDate).slice(0, 10)
        : `${quota.monthYear}-01`;
    const meta = details[quota.id];

    return {
      id: index + 1,
      quotaId: quota.id,
      date,
      ownerId: quota.ownerId,
      ownerName: owner?.fullName ?? "",
      property: display?.condominiumName ?? "",
      propertyId: display?.condominiumId,
      unit: display?.unitLabel ?? "",
      amount: quota.amount,
      paymentMethod: meta?.paymentMethod ?? "Bank Transfer",
      status: QUOTA_TO_PAYMENT_STATUS[quota.status],
      receiptNumber: meta?.receiptNumber ?? "",
      timestamp: meta?.timestamp ?? `${date}T10:30:00Z`,
      monthYear: quota.monthYear,
      quotaStatus: quota.status,
    };
  });
}

export function quotasToOverdueItems(
  quotas: QuotaPayment[],
  portfolio: Portfolio,
  agreements: PaymentAgreement[] = [],
): OverdueItem[] {
  const { ownerById, condoById } = portfolioLookup(portfolio);
  const covered = activeCoveredQuotaIds(agreements);

  return quotas
    .filter((q) => q.status === "overdue" && !covered.has(q.id))
    .map((q) => {
      const owner = ownerById.get(q.ownerId);
      const display = owner
        ? ownerDisplay(portfolio, owner, condoById)
        : undefined;
      return {
        id: q.id,
        ownerId: q.ownerId,
        ownerName: owner?.fullName ?? "",
        email: owner?.contacts.email ?? "",
        phone: owner?.contacts.phone ?? "",
        unit: display?.unitLabel ?? "",
        property: display?.condominiumName ?? "",
        propertyId: display?.condominiumId,
        amount: q.amount,
        dueDate: quotaDueDate(q.monthYear),
        monthYear: q.monthYear,
      };
    });
}

/** Join domain owners with quota-derived payment balances. */
export function applyOwnerBalances(
  portfolio: Portfolio,
  quotas: QuotaPayment[],
  avatars: Record<string, string> = {},
  charges: AccountCharge[] = [],
  receipts: AccountReceipt[] = [],
  agreements: PaymentAgreement[] = [],
): OwnerRow[] {
  const quotasByOwner = groupByOwnerId(quotas);
  const chargesByOwner = groupByOwnerId(charges);
  const receiptsByOwner = groupByOwnerId(receipts);
  const onPlan = ownersOnActivePlan(agreements);
  return portfolioToOwnerRows(portfolio, avatars).map((row) => {
    const ownerQuotas = quotasByOwner.get(row.owner.id) ?? [];
    const ownerCharges = chargesByOwner.get(row.owner.id) ?? [];
    const ownerReceipts = receiptsByOwner.get(row.owner.id) ?? [];
    const derived = deriveStatus(ownerQuotas);
    const movements = buildExtract(
      row.owner.id,
      ownerQuotas,
      ownerCharges,
      ownerReceipts,
    );
    const balance = closingBalance(movements);
    let lastPayment = derived.lastPayment;
    for (const receipt of ownerReceipts) {
      if (!lastPayment || receipt.date > lastPayment) lastPayment = receipt.date;
    }
    const onPlanStatus = onPlan.has(row.owner.id);
    const paymentStatus: PaymentStatus = onPlanStatus
      ? "agreement"
      : derived.paymentStatus === "overdue"
        ? "overdue"
        : balance > 0
          ? "pending"
          : derived.paymentStatus || (movements.length > 0 ? "current" : "");
    return {
      ...row,
      paymentStatus,
      currentBalance: balance,
      lastPayment,
    };
  });
}
