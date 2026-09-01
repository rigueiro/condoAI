import type { AnnualBudget, QuotaPayment, Unit } from "@/types";
import { billedOwnerId } from "@/lib/finance/extraordinary";
import { summarizeBudget } from "@/lib/finance/budget";
import { calculateMonthlyQuota, roundCurrency } from "@/lib/quota";
import { quotaDueDate } from "./ledger";
import { todayKey } from "./dates";

const MONTH_YEAR_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type OrdinaryRunRow = {
  ownerId: string;
  amount: number;
  unitLabels: string[];
};

export type IssueOrdinaryInput = {
  condominiumId: string;
  monthYear: string;
};

export type IssueOrdinaryResult = {
  issued: number;
  skipped: number;
  monthYear: string;
};

export function isMonthYear(value: string): boolean {
  return MONTH_YEAR_PATTERN.test(value);
}

export function yearFromMonthYear(monthYear: string): number {
  return Number(monthYear.slice(0, 4));
}

export function ordinaryRunId(
  condominiumId: string,
  ownerId: string,
  monthYear: string,
): string {
  return `run-${condominiumId}-${ownerId}-${monthYear}`;
}

export function isOrdinaryRunId(id: string, condominiumId?: string): boolean {
  return condominiumId
    ? id.startsWith(`run-${condominiumId}-`)
    : id.startsWith("run-");
}

/** Pending until the 8th of the billed month; overdue after that date. */
export function statusForIssuedMonth(
  monthYear: string,
  now = new Date(),
): QuotaPayment["status"] {
  return todayKey(now) > quotaDueDate(monthYear) ? "overdue" : "pending";
}

/**
 * Split the monthly collectable from an approved budget by unit permillage
 * (same math as the mapa de rateio), then group by billed owner.
 */
export function allocateOrdinaryMonth(input: {
  units: Unit[];
  condominiumId: string;
  collectable: number;
  totalPermillage: number;
}): OrdinaryRunRow[] {
  const byOwner = new Map<string, OrdinaryRunRow>();
  const { totalPermillage, collectable, condominiumId } = input;

  for (const unit of input.units) {
    if (unit.condominiumId !== condominiumId) continue;
    const ownerId = billedOwnerId(unit);
    if (!ownerId) continue;
    const permillage = Number(unit.permillage) || 0;
    if (permillage <= 0) continue;
    const amount = calculateMonthlyQuota(
      collectable,
      permillage,
      totalPermillage,
    );
    if (amount <= 0) continue;
    const existing = byOwner.get(ownerId);
    if (existing) {
      existing.amount = roundCurrency(existing.amount + amount);
      existing.unitLabels.push(unit.label);
    } else {
      byOwner.set(ownerId, {
        ownerId,
        amount,
        unitLabels: [unit.label],
      });
    }
  }

  return [...byOwner.values()].sort((a, b) => a.ownerId.localeCompare(b.ownerId));
}

export function previewOrdinaryMonth(input: {
  units: Unit[];
  condominiumId: string;
  totalPermillage: number;
  budget: AnnualBudget | undefined;
}): { rows: OrdinaryRunRow[]; monthlyTotal: number } {
  if (!input.budget || input.budget.status !== "approved") {
    return { rows: [], monthlyTotal: 0 };
  }
  const summary = summarizeBudget(input.budget);
  return {
    rows: allocateOrdinaryMonth({
      units: input.units,
      condominiumId: input.condominiumId,
      collectable: summary.collectable,
      totalPermillage: input.totalPermillage,
    }),
    monthlyTotal: summary.monthlyTotal,
  };
}

/**
 * Idempotent per condo+owner+month. Converts a lone pending seed row for
 * that month; otherwise appends a new QuotaPayment.
 */
export function applyOrdinaryRun(
  quotas: QuotaPayment[],
  rows: OrdinaryRunRow[],
  condominiumId: string,
  monthYear: string,
  now = new Date(),
): { quotas: QuotaPayment[]; issued: number; skipped: number } {
  const status = statusForIssuedMonth(monthYear, now);
  const sameMonthByOwner = new Map<string, QuotaPayment[]>();
  for (const quota of quotas) {
    if (quota.monthYear !== monthYear) continue;
    const list = sameMonthByOwner.get(quota.ownerId);
    if (list) list.push(quota);
    else sameMonthByOwner.set(quota.ownerId, [quota]);
  }

  const drop = new Set<string>();
  const issuedRows: QuotaPayment[] = [];
  let issued = 0;
  let skipped = 0;

  for (const row of rows) {
    const runId = ordinaryRunId(condominiumId, row.ownerId, monthYear);
    const sameMonth = sameMonthByOwner.get(row.ownerId) ?? [];
    if (sameMonth.some((quota) => quota.id === runId)) {
      skipped += 1;
      continue;
    }

    const hasOtherRun = sameMonth.some((quota) => isOrdinaryRunId(quota.id));
    if (!hasOtherRun && sameMonth.some((quota) => quota.status === "paid")) {
      skipped += 1;
      continue;
    }

    if (!hasOtherRun) {
      for (const quota of sameMonth) {
        if (!isOrdinaryRunId(quota.id) && quota.status !== "paid") {
          drop.add(quota.id);
        }
      }
    }

    issuedRows.push({
      id: runId,
      ownerId: row.ownerId,
      monthYear,
      amount: row.amount,
      status,
      paymentDate: null,
    });
    issued += 1;
  }

  return {
    quotas: [...issuedRows, ...quotas.filter((quota) => !drop.has(quota.id))],
    issued,
    skipped,
  };
}
