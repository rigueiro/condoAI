import type { Occupancy, OccupancyRole, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";

export const OCCUPANCY_ROLES: OccupancyRole[] = [
  "owner",
  "tenant",
  "representative",
];

const ROLE_SET = new Set<string>(OCCUPANCY_ROLES);

export type OccupancyLink = {
  unitId: string;
  role: OccupancyRole;
};

export type Occupant = {
  owner: Owner;
  role: OccupancyRole;
};

type LegacyOwner = Owner & {
  unitId?: string;
  unitPermillage?: number;
  type?: string;
};

export function isOccupancyRole(value: string): value is OccupancyRole {
  return ROLE_SET.has(value);
}

export function parseOccupancyRole(value: string | undefined): OccupancyRole {
  const normalized = (value ?? "owner").trim().toLowerCase();
  return isOccupancyRole(normalized) ? normalized : "owner";
}

export function normalizeOccupancies(
  occupancies: Occupancy[] | undefined,
): Occupancy[] {
  if (!Array.isArray(occupancies)) return [];
  const seen = new Set<string>();
  const next: Occupancy[] = [];
  for (const item of occupancies) {
    if (!item?.ownerId || seen.has(item.ownerId)) continue;
    seen.add(item.ownerId);
    next.push({ ownerId: item.ownerId, role: parseOccupancyRole(item.role) });
  }
  return next;
}

export type OccupancyOnUnit = {
  unit: Unit;
  role: OccupancyRole;
};

export function indexOccupanciesByOwnerId(
  units: Unit[],
): Map<string, OccupancyOnUnit[]> {
  const map = new Map<string, OccupancyOnUnit[]>();
  for (const unit of units) {
    for (const occupancy of unit.occupancies ?? []) {
      const list = map.get(occupancy.ownerId);
      const entry = { unit, role: occupancy.role };
      if (list) list.push(entry);
      else map.set(occupancy.ownerId, [entry]);
    }
  }
  return map;
}

export function occupanciesForOwner(
  units: Unit[],
  ownerId: string,
  index?: Map<string, OccupancyOnUnit[]>,
): OccupancyOnUnit[] {
  if (index) return index.get(ownerId) ?? [];
  const links: OccupancyOnUnit[] = [];
  for (const unit of units) {
    const occupancy = (unit.occupancies ?? []).find(
      (item) => item.ownerId === ownerId,
    );
    if (occupancy) links.push({ unit, role: occupancy.role });
  }
  return links;
}

export function indexOccupantsByUnitId(
  units: Unit[],
  owners: Owner[],
): Map<string, Occupant[]> {
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const map = new Map<string, Occupant[]>();
  for (const unit of units) {
    const occupants: Occupant[] = [];
    for (const occupancy of unit.occupancies ?? []) {
      const owner = ownerById.get(occupancy.ownerId);
      if (owner) occupants.push({ owner, role: occupancy.role });
    }
    map.set(unit.id, occupants);
  }
  return map;
}

export function applyOwnerOccupancies(
  units: Unit[],
  ownerId: string,
  links: OccupancyLink[],
): Unit[] {
  const byUnitId = new Map<string, OccupancyRole>();
  for (const link of links) {
    if (!link.unitId) continue;
    byUnitId.set(link.unitId, parseOccupancyRole(link.role));
  }

  return units.map((unit) => {
    const occupancies = unit.occupancies ?? [];
    const role = byUnitId.get(unit.id);
    const withoutOwner = occupancies.filter((item) => item.ownerId !== ownerId);
    if (role == null) {
      return withoutOwner.length === occupancies.length
        ? unit
        : { ...unit, occupancies: withoutOwner };
    }
    return {
      ...unit,
      occupancies: [...withoutOwner, { ownerId, role }],
    };
  });
}

export function stripOwnerOccupancies(units: Unit[], ownerId: string): Unit[] {
  return units.map((unit) => {
    const occupancies = unit.occupancies ?? [];
    const next = occupancies.filter((item) => item.ownerId !== ownerId);
    return next.length === occupancies.length
      ? unit
      : { ...unit, occupancies: next };
  });
}

function stripLegacyOwner(raw: LegacyOwner): Owner {
  return {
    id: raw.id,
    fullName: raw.fullName,
    contacts: raw.contacts,
    taxId: raw.taxId ?? "",
    monthlyQuota: raw.monthlyQuota ?? 0,
    documents: raw.documents ?? [],
    entryDate: raw.entryDate,
    exitDate: raw.exitDate ?? null,
  };
}

/** Lift legacy Owner.unitId / Owner.type onto Unit.occupancies. */
export function migratePortfolioOccupancy(portfolio: Portfolio): Portfolio {
  const units = (portfolio.units ?? []).map((unit) => ({
    ...unit,
    occupancies: normalizeOccupancies(unit.occupancies),
  }));
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  const owners = (portfolio.owners ?? []).map((raw) => {
    const legacy = raw as LegacyOwner;
    if (legacy.unitId) {
      const unit = unitById.get(legacy.unitId);
      if (
        unit &&
        !unit.occupancies.some((item) => item.ownerId === legacy.id)
      ) {
        unit.occupancies = [
          ...unit.occupancies,
          {
            ownerId: legacy.id,
            role: parseOccupancyRole(legacy.type),
          },
        ];
      }
    }
    return stripLegacyOwner(legacy);
  });

  return { ...portfolio, units, owners };
}
