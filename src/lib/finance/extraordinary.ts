import type { Unit } from "@/types";
import { roundCurrency } from "@/lib/quota";
import type { ExtraordinaryAllocation } from "./types";

/** Bill the occupancy with role `owner`; fall back to the first occupancy. */
export function billedOwnerId(unit: Unit): string | undefined {
  const occupancies = unit.occupancies ?? [];
  return (
    occupancies.find((item) => item.role === "owner")?.ownerId ??
    occupancies[0]?.ownerId
  );
}

/**
 * Split a quota extraordinária by unit permillage among billed fractions.
 * Remainder cents go to the last row so allocations sum to `totalAmount`.
 */
export function allocateExtraordinary(
  units: Unit[],
  condominiumId: string,
  totalAmount: number,
  ownerIds?: Set<string>,
): ExtraordinaryAllocation[] {
  const billed: { ownerId: string; unit: Unit; permillage: number }[] = [];
  let permillageBase = 0;

  for (const unit of units) {
    if (unit.condominiumId !== condominiumId) continue;
    const ownerId = billedOwnerId(unit);
    if (!ownerId || (ownerIds && !ownerIds.has(ownerId))) continue;
    const permillage = Number(unit.permillage) || 0;
    if (permillage <= 0) continue;
    billed.push({ ownerId, unit, permillage });
    permillageBase += permillage;
  }

  if (billed.length === 0 || permillageBase <= 0) return [];
  billed.sort((a, b) => a.unit.label.localeCompare(b.unit.label));

  const last = billed.length - 1;
  const allocations: ExtraordinaryAllocation[] = new Array(billed.length);
  let allocated = 0;
  for (let i = 0; i <= last; i++) {
    const row = billed[i];
    const amount =
      i === last
        ? roundCurrency(totalAmount - allocated)
        : roundCurrency((totalAmount * row.permillage) / permillageBase);
    if (i !== last) allocated += amount;
    allocations[i] = {
      ownerId: row.ownerId,
      unitId: row.unit.id,
      unitLabel: row.unit.label,
      permillage: row.permillage,
      amount,
    };
  }
  return allocations;
}

export function ownerCountFromAllocations(
  allocations: ExtraordinaryAllocation[],
): number {
  return new Set(allocations.map((row) => row.ownerId)).size;
}

export function groupAllocationsByOwner(
  allocations: ExtraordinaryAllocation[],
): { ownerId: string; amount: number }[] {
  const byOwner = new Map<string, number>();
  for (const row of allocations) {
    if (row.amount <= 0) continue;
    byOwner.set(
      row.ownerId,
      roundCurrency((byOwner.get(row.ownerId) ?? 0) + row.amount),
    );
  }
  return [...byOwner.entries()].map(([ownerId, amount]) => ({
    ownerId,
    amount,
  }));
}
