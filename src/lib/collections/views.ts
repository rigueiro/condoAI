import type { QuotaPayment } from "@/types";
import type { PaymentView } from "@/fixtures/views";
import type {
  OwnerRow,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import type { Portfolio } from "@/lib/portfolio/types";
import { ownerDisplay, portfolioToOwnerRows } from "@/lib/portfolio/mappers";
import type { OverdueItem, PaymentDetails } from "./types";

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

function quotasByOwnerId(
  quotas: QuotaPayment[],
): Map<string, QuotaPayment[]> {
  const map = new Map<string, QuotaPayment[]>();
  for (const q of quotas) {
    const list = map.get(q.ownerId) ?? [];
    list.push(q);
    map.set(q.ownerId, list);
  }
  return map;
}

function deriveBalances(
  quotas: QuotaPayment[],
): Pick<OwnerRow, "paymentStatus" | "currentBalance" | "lastPayment"> {
  let balance = 0;
  let hasOverdue = false;
  let hasPending = false;
  let lastPayment = "";

  for (const q of quotas) {
    if (q.status === "overdue" || q.status === "pending") {
      balance += q.amount;
      if (q.status === "overdue") hasOverdue = true;
      else hasPending = true;
    } else if (q.status === "paid" && q.paymentDate) {
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

  return { paymentStatus, currentBalance: balance, lastPayment };
}

function portfolioLookup(portfolio: Portfolio) {
  return {
    ownerById: new Map(portfolio.owners.map((o) => [o.id, o])),
    unitById: new Map(portfolio.units.map((u) => [u.id, u])),
    condoById: new Map(portfolio.condominiums.map((c) => [c.id, c])),
  };
}

export function quotasToPaymentRows(
  quotas: QuotaPayment[],
  portfolio: Portfolio,
  details: Record<string, PaymentDetails>,
): PaymentRow[] {
  const { ownerById, unitById, condoById } = portfolioLookup(portfolio);

  return quotas.map((quota, index) => {
    const owner = ownerById.get(quota.ownerId);
    const display = owner
      ? ownerDisplay(portfolio, owner, unitById, condoById)
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
      receiptNumber:
        meta?.receiptNumber ??
        `RCP-${quota.monthYear.replace("-", "")}-${quota.id.toUpperCase()}`,
      timestamp: meta?.timestamp ?? `${date}T10:30:00Z`,
      monthYear: quota.monthYear,
      quotaStatus: quota.status,
    };
  });
}

export function quotasToOverdueItems(
  quotas: QuotaPayment[],
  portfolio: Portfolio,
): OverdueItem[] {
  const { ownerById, unitById, condoById } = portfolioLookup(portfolio);

  return quotas
    .filter((q) => q.status === "overdue")
    .map((q) => {
      const owner = ownerById.get(q.ownerId);
      const display = owner
        ? ownerDisplay(portfolio, owner, unitById, condoById)
        : undefined;
      return {
        id: q.id,
        ownerId: q.ownerId,
        ownerName: owner?.fullName ?? "",
        email: owner?.contacts.email ?? "",
        unit: display?.unitLabel ?? "",
        property: display?.condominiumName ?? "",
        amount: q.amount,
        dueDate: `${q.monthYear}-08`,
        monthYear: q.monthYear,
      };
    });
}

/** Join domain owners with quota-derived payment balances. */
export function applyOwnerBalances(
  portfolio: Portfolio,
  quotas: QuotaPayment[],
  avatars: Record<string, string> = {},
): OwnerRow[] {
  const byOwner = quotasByOwnerId(quotas);
  return portfolioToOwnerRows(portfolio, avatars).map((row) => ({
    ...row,
    ...deriveBalances(byOwner.get(row.owner.id) ?? []),
  }));
}
