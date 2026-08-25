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

export function vendorNameById(vendors: Vendor[]): Map<string, string> {
  return new Map(vendors.map((v) => [v.id, v.name]));
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
