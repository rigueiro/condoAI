import type { QuotaPayment } from "@/types";
import type { PaymentView } from "@/fixtures/views";
import type { Owner as OwnerView } from "@/app/[locale]/owners-management/components/types";
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

export function quotasToPaymentRows(
  quotas: QuotaPayment[],
  owners: OwnerView[],
  details: Record<string, PaymentDetails>,
): PaymentRow[] {
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  return quotas.map((quota, index) => {
    const owner = ownerById.get(quota.ownerId);
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
      ownerName: owner?.name ?? "",
      property: owner?.property ?? "",
      propertyId: owner?.propertyId,
      unit: owner?.unit ?? "",
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
  owners: OwnerView[],
): OverdueItem[] {
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  return quotas
    .filter((q) => q.status === "overdue")
    .map((q) => {
      const owner = ownerById.get(q.ownerId);
      return {
        id: q.id,
        ownerId: q.ownerId,
        ownerName: owner?.name ?? "",
        email: owner?.email ?? "",
        unit: owner?.unit ?? "",
        property: owner?.property ?? "",
        amount: q.amount,
        dueDate: `${q.monthYear}-08`,
        monthYear: q.monthYear,
      };
    });
}

export function applyOwnerBalances(
  owners: OwnerView[],
  quotas: QuotaPayment[],
): OwnerView[] {
  const byOwner = new Map<string, QuotaPayment[]>();
  for (const q of quotas) {
    const list = byOwner.get(q.ownerId) ?? [];
    list.push(q);
    byOwner.set(q.ownerId, list);
  }

  return owners.map((owner) => {
    const list = byOwner.get(owner.id) ?? [];
    let balance = 0;
    let hasOverdue = false;
    let hasPending = false;
    let lastPayment = owner.lastPayment;

    for (const q of list) {
      if (q.status === "overdue" || q.status === "pending") {
        balance += q.amount;
        if (q.status === "overdue") hasOverdue = true;
        else hasPending = true;
      } else if (q.status === "paid" && q.paymentDate) {
        const paid = String(q.paymentDate).slice(0, 10);
        if (!lastPayment || paid > lastPayment) lastPayment = paid;
      }
    }

    return {
      ...owner,
      paymentStatus: hasOverdue
        ? "overdue"
        : hasPending
          ? "pending"
          : list.length > 0
            ? "current"
            : "",
      currentBalance: balance,
      lastPayment,
    };
  });
}
