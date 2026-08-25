import type { QuotaPayment } from "@/types";
import { roundCurrency } from "@/lib/quota";
import { daysOverdue } from "@/lib/collections/reminders";
import { quotaDueDate } from "@/lib/collections/ledger";
import { todayKey } from "@/lib/collections/dates";
import {
  ownerDisplay,
  type OwnerDisplay,
  type Portfolio,
} from "@/lib/portfolio";
import { indexOccupanciesByOwnerId } from "@/lib/portfolio/occupancy";
import {
  AGING_BUCKETS,
  type AgingBucketId,
  type AgingBucketSummary,
  type AgingReport,
  type AgingRow,
} from "./types";

function bucketForDays(days: number): AgingBucketId {
  for (const bucket of AGING_BUCKETS) {
    if (days < bucket.minDays) continue;
    if (bucket.maxDays == null || days <= bucket.maxDays) return bucket.id;
  }
  return "90+";
}

export function buildAgingReport(input: {
  quotas: QuotaPayment[];
  portfolio: Portfolio;
  condominiumId?: string | null;
  now?: Date;
}): AgingReport {
  const { quotas, portfolio, now = new Date() } = input;
  const condominiumId = input.condominiumId || null;
  const condoById = new Map(
    portfolio.condominiums.map((c) => [c.id, c] as const),
  );
  const ownerById = new Map(portfolio.owners.map((o) => [o.id, o]));
  const linksByOwner = indexOccupanciesByOwnerId(portfolio.units);
  const displayCache = new Map<string, OwnerDisplay | undefined>();

  const displayFor = (ownerId: string) => {
    if (displayCache.has(ownerId)) return displayCache.get(ownerId);
    const owner = ownerById.get(ownerId);
    const display = owner
      ? ownerDisplay(portfolio, owner, condoById, linksByOwner)
      : undefined;
    displayCache.set(ownerId, display);
    return display;
  };

  const rows: AgingRow[] = [];
  let totalAmount = 0;
  const bucketMap = new Map<AgingBucketId, AgingBucketSummary>();
  for (const bucket of AGING_BUCKETS) {
    bucketMap.set(bucket.id, { id: bucket.id, count: 0, amount: 0 });
  }

  for (const quota of quotas) {
    if (quota.status === "paid") continue;
    const display = displayFor(quota.ownerId);
    if (
      condominiumId &&
      !(display?.condominiumIds ?? []).includes(condominiumId)
    ) {
      continue;
    }

    const scopedOccupancies = condominiumId
      ? (display?.occupancies ?? []).filter(
          (item) => item.condominiumId === condominiumId,
        )
      : (display?.occupancies ?? []);
    const scopedCondoId =
      condominiumId ??
      display?.condominiumId ??
      scopedOccupancies[0]?.condominiumId ??
      "";
    const dueDate = quotaDueDate(quota.monthYear);
    const days = daysOverdue(dueDate, now);
    const bucket = bucketForDays(days);

    rows.push({
      quotaId: quota.id,
      ownerId: quota.ownerId,
      ownerName: ownerById.get(quota.ownerId)?.fullName ?? "",
      condominiumId: scopedCondoId,
      condominiumName:
        (scopedCondoId ? condoById.get(scopedCondoId)?.name : undefined) ??
        scopedOccupancies[0]?.condominiumName ??
        display?.condominiumName ??
        "",
      unitLabel:
        scopedOccupancies.map((item) => item.unitLabel).join(", ") ||
        display?.unitLabel ||
        "",
      monthYear: quota.monthYear,
      dueDate,
      amount: quota.amount,
      daysOverdue: days,
      bucket,
      status: quota.status === "overdue" ? "overdue" : "pending",
    });

    totalAmount = roundCurrency(totalAmount + quota.amount);
    const summary = bucketMap.get(bucket)!;
    summary.count += 1;
    summary.amount = roundCurrency(summary.amount + quota.amount);
  }

  rows.sort(
    (a, b) =>
      b.daysOverdue - a.daysOverdue ||
      b.amount - a.amount ||
      a.ownerName.localeCompare(b.ownerName),
  );

  return {
    asOf: todayKey(now),
    condominiumId,
    condominiumName: condominiumId
      ? (condoById.get(condominiumId)?.name ?? null)
      : null,
    buckets: AGING_BUCKETS.map((b) => bucketMap.get(b.id)!),
    totalCount: rows.length,
    totalAmount,
    rows,
  };
}
