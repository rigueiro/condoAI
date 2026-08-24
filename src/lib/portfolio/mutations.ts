import type { Condominium, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";
import {
  applyOwnerOccupancies,
  stripOwnerOccupancies,
  type OccupancyLink,
} from "./occupancy";
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
  const units = portfolio.units.filter((u) => u.condominiumId !== condominiumId);
  const remainingOwnerIds = new Set(
    units.flatMap((unit) =>
      (unit.occupancies ?? []).map((item) => item.ownerId),
    ),
  );
  return {
    ...portfolio,
    condominiums: portfolio.condominiums.filter((c) => c.id !== condominiumId),
    units,
    owners: portfolio.owners.filter((owner) => remainingOwnerIds.has(owner.id)),
  };
}

/** Upsert a person and optionally replace their fraction occupancies. */
export function upsertOwnerInMemory(
  portfolio: Portfolio,
  owner: Owner,
  occupancies?: OccupancyLink[],
): Portfolio {
  const unitById = new Map(portfolio.units.map((unit) => [unit.id, unit]));
  if (occupancies) {
    for (const link of occupancies) {
      if (!unitById.has(link.unitId)) {
        throw new Error("unitNotFound");
      }
    }
  }

  const units =
    occupancies != null
      ? applyOwnerOccupancies(portfolio.units, owner.id, occupancies)
      : portfolio.units;

  const ownerExists = portfolio.owners.some((o) => o.id === owner.id);
  const owners = ownerExists
    ? portfolio.owners.map((o) => (o.id === owner.id ? owner : o))
    : [...portfolio.owners, owner];

  return { ...portfolio, units, owners };
}

/** Remove a person and drop their occupancies from every fraction. */
export function removeOwnerInMemory(
  portfolio: Portfolio,
  ownerId: string,
): Portfolio {
  return {
    ...portfolio,
    units: stripOwnerOccupancies(portfolio.units, ownerId),
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

/** Upsert a fraction. Occupancies default to the previous record when omitted. */
export function upsertUnitInMemory(
  portfolio: Portfolio,
  unit: Unit,
): Portfolio {
  const previous = portfolio.units.find((u) => u.id === unit.id);
  const nextUnit = normalizeUnit({
    ...unit,
    occupancies: unit.occupancies ?? previous?.occupancies ?? [],
  });
  assertUnitWritable(portfolio, nextUnit);

  const units = previous
    ? portfolio.units.map((u) => (u.id === nextUnit.id ? nextUnit : u))
    : [...portfolio.units, nextUnit];

  return { ...portfolio, units };
}

/** Remove a fraction. Blocked while anyone still occupies it. */
export function removeUnitInMemory(
  portfolio: Portfolio,
  unitId: string,
): Portfolio {
  const unit = portfolio.units.find((u) => u.id === unitId);
  if (!unit) {
    throw new Error("unitNotFound");
  }
  if ((unit.occupancies ?? []).length > 0) {
    throw new Error("unitHasOwners");
  }
  return {
    ...portfolio,
    units: portfolio.units.filter((u) => u.id !== unitId),
  };
}
