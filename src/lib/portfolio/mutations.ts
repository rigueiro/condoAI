import type { Condominium, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";
import {
  PERMILLAGE_TOLERANCE,
  TOTAL_PERMILLAGE,
  isUnitType,
  normalizeUnit,
  roundPermillage,
  sumPermillage,
  unitsForCondominium,
} from "./units";

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

function assertUnitWritable(portfolio: Portfolio, unit: Unit): void {
  const condominium = portfolio.condominiums.find(
    (c) => c.id === unit.condominiumId,
  );
  if (!condominium) {
    throw new Error("condominiumNotFound");
  }
  if (!unit.label) {
    throw new Error("labelRequired");
  }
  if (!isUnitType(unit.type)) {
    throw new Error("invalidType");
  }
  if (!Number.isFinite(unit.permillage) || unit.permillage <= 0) {
    throw new Error("invalidPermillage");
  }

  const siblings = unitsForCondominium(
    portfolio.units,
    unit.condominiumId,
  ).filter((u) => u.id !== unit.id);
  const duplicate = siblings.some(
    (u) => u.label.toLowerCase() === unit.label.toLowerCase(),
  );
  if (duplicate) {
    throw new Error("duplicateLabel");
  }

  const nextSum = roundPermillage(sumPermillage(siblings) + unit.permillage);
  const total = condominium.totalPermillage || TOTAL_PERMILLAGE;
  if (nextSum > total + PERMILLAGE_TOLERANCE) {
    throw new Error("permillageExceedsTotal");
  }
}

/** Upsert a fraction and keep linked owners' unitPermillage in sync. */
export function upsertUnitInMemory(
  portfolio: Portfolio,
  unit: Unit,
): Portfolio {
  const nextUnit = normalizeUnit(unit);
  assertUnitWritable(portfolio, nextUnit);

  const previous = portfolio.units.find((u) => u.id === nextUnit.id);
  const units = previous
    ? portfolio.units.map((u) => (u.id === nextUnit.id ? nextUnit : u))
    : [...portfolio.units, nextUnit];

  const owners =
    previous?.permillage === nextUnit.permillage
      ? portfolio.owners
      : portfolio.owners.map((owner) =>
          owner.unitId === nextUnit.id
            ? { ...owner, unitPermillage: nextUnit.permillage }
            : owner,
        );

  return { ...portfolio, units, owners };
}

/** Remove a fraction. Blocked while any owner still references it. */
export function removeUnitInMemory(
  portfolio: Portfolio,
  unitId: string,
): Portfolio {
  const unit = portfolio.units.find((u) => u.id === unitId);
  if (!unit) {
    throw new Error("unitNotFound");
  }
  const linked = portfolio.owners.some((owner) => owner.unitId === unitId);
  if (linked) {
    throw new Error("unitHasOwners");
  }
  return {
    ...portfolio,
    units: portfolio.units.filter((u) => u.id !== unitId),
  };
}
