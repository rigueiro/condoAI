import type { Condominium, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";

/** Pure in-memory upsert (shared by client demo + server store). */
export function upsertCondominiumInMemory(
  portfolio: Portfolio,
  condominium: Condominium,
): Portfolio {
  const exists = portfolio.condominiums.some((c) => c.id === condominium.id);
  const condominiums = exists
    ? portfolio.condominiums.map((c) =>
        c.id === condominium.id ? condominium : c,
      )
    : [...portfolio.condominiums, condominium];
  return { ...portfolio, condominiums };
}

/** Pure in-memory remove with unit/owner cascade. */
export function removeCondominiumInMemory(
  portfolio: Portfolio,
  condominiumId: string,
): Portfolio {
  const unitIds = new Set(
    portfolio.units
      .filter((u) => u.condominiumId === condominiumId)
      .map((u) => u.id),
  );
  return {
    ...portfolio,
    condominiums: portfolio.condominiums.filter((c) => c.id !== condominiumId),
    units: portfolio.units.filter((u) => u.condominiumId !== condominiumId),
    owners: portfolio.owners.filter((o) => !unitIds.has(o.unitId)),
  };
}

/** Upsert owner and optionally its unit (create/update by id). */
export function upsertOwnerInMemory(
  portfolio: Portfolio,
  owner: Owner,
  unit?: Unit,
): Portfolio {
  let units = portfolio.units;
  if (unit) {
    const unitExists = units.some((u) => u.id === unit.id);
    units = unitExists
      ? units.map((u) => (u.id === unit.id ? unit : u))
      : [...units, unit];
  }

  const ownerExists = portfolio.owners.some((o) => o.id === owner.id);
  const owners = ownerExists
    ? portfolio.owners.map((o) => (o.id === owner.id ? owner : o))
    : [...portfolio.owners, owner];

  return { ...portfolio, units, owners };
}

/** Remove owner; leave the unit in place (may be reassigned later). */
export function removeOwnerInMemory(
  portfolio: Portfolio,
  ownerId: string,
): Portfolio {
  return {
    ...portfolio,
    owners: portfolio.owners.filter((o) => o.id !== ownerId),
  };
}
