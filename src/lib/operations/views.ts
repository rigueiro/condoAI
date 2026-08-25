import type { Condominium, Vendor } from "@/types";
import type { ContractAttentionItem, OperationsState } from "./types";

const DUE_SOON_DAYS = 60;

function toDateOnly(value: Date | string): string {
  return String(value).slice(0, 10);
}

function daysUntil(dueDate: string, now: Date): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function vendorsForCondominium(
  vendors: Vendor[],
  condominiumId: string,
): Vendor[] {
  return vendors.filter((v) => v.condominiumId === condominiumId);
}

export function vendorNameById(vendors: Vendor[]): Map<string, string> {
  return new Map(vendors.map((v) => [v.id, v.name]));
}

/** Prefer linked vendor name; fall back to legacy free-text field. */
export function resolveVendorLabel(
  vendorId: string | null | undefined,
  names: Map<string, string>,
  fallback?: string | null,
): string {
  if (vendorId) {
    const linked = names.get(vendorId);
    if (linked) return linked;
  }
  return fallback?.trim() ?? "";
}

/** Count references per vendor across contracts, expenses, and occurrences. */
export function buildVendorReferenceCounts(
  contracts: { vendorId: string }[],
  expenses: { vendorId: string | null }[],
  occurrences: { vendorId: string | null }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (vendorId: string | null | undefined) => {
    if (!vendorId) return;
    counts.set(vendorId, (counts.get(vendorId) ?? 0) + 1);
  };
  for (const c of contracts) bump(c.vendorId);
  for (const e of expenses) bump(e.vendorId);
  for (const o of occurrences) bump(o.vendorId);
  return counts;
}

export function buildContractAttentionItems(
  state: OperationsState,
  condominiums: Condominium[],
  now = new Date(),
): ContractAttentionItem[] {
  const condoNameById = new Map(condominiums.map((c) => [c.id, c.name]));
  const names = vendorNameById(state.vendors);

  return state.contracts
    .flatMap((c) => {
      if (!c.endDate) return [];
      const endDate = toDateOnly(c.endDate);
      const days = daysUntil(endDate, now);
      if (days > DUE_SOON_DAYS) return [];
      return [
        {
          id: c.id,
          condominiumId: c.condominiumId,
          condominiumName:
            condoNameById.get(c.condominiumId) ?? c.condominiumId,
          vendorName: names.get(c.vendorId) ?? c.vendorId,
          service: c.service,
          endDate,
          daysUntil: days,
          urgency: days < 0 ? ("overdue" as const) : ("due-soon" as const),
        },
      ];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
