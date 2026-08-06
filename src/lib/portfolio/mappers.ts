import { formatPortugueseAddress } from "@/lib/address";
import { roundCurrency } from "@/lib/quota";
import type { OwnerRow } from "@/app/[locale]/owners-management/components/types";
import type { Condominium, Owner, QuotaPayment, Unit } from "@/types";
import type { Portfolio } from "./types";

export const COMMON_AREA_LABELS: Record<string, string> = {
  elevators: "Elevators",
  garden: "Garden",
  parking: "Parking",
  gym: "Gym",
  pool: "Swimming Pool",
  concierge: "Concierge",
  security: "Security",
  rooftop: "Rooftop Terrace",
  playground: "Playground",
  "lake-access": "Lake Access",
  "tennis-court": "Tennis Court",
  "business-center": "Business Center",
  storage: "Storage",
  laundry: "Laundry",
};

export const BUILDING_TYPES: Condominium["buildingType"][] = [
  "low-rise",
  "mid-rise",
  "high-rise",
  "townhouse",
];

export const CONDOMINIUM_STATUSES: Condominium["status"][] = [
  "active",
  "inactive",
  "under-construction",
];

const BUILDING_TYPE_I18N: Record<Condominium["buildingType"], string> = {
  "low-rise": "lowRise",
  "mid-rise": "midRise",
  "high-rise": "highRise",
  townhouse: "townhouse",
};

const STATUS_I18N: Record<Condominium["status"], string> = {
  active: "active",
  inactive: "inactive",
  "under-construction": "underConstruction",
};

export function buildingTypeI18nKey(
  type: Condominium["buildingType"],
): string {
  return BUILDING_TYPE_I18N[type];
}

export function condominiumStatusI18nKey(
  status: Condominium["status"],
): string {
  return STATUS_I18N[status];
}

export type CondoStats = {
  occupiedUnits: number;
  averageFee: number;
  monthlyFeeRange: string;
  collectionRate: number;
};

export type CollectionBreakdown = {
  id: string;
  name: string;
  unitsCount: number;
  collected: number;
  target: number;
  collectionRate: number;
  outstanding: number;
};

export type CollectionSummaryData = {
  currentMonth: {
    totalTarget: number;
    totalCollected: number;
    collectionRate: number;
    outstandingBalance: number;
    totalProperties: number;
  };
  propertyBreakdown: CollectionBreakdown[];
};

function feeRange(min: number, max: number): string {
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

export function labelCommonAreas(areas: string[]): string[] {
  return areas.map((area) => COMMON_AREA_LABELS[area] ?? area);
}

export function ownersByCondoId(portfolio: Portfolio): Map<string, Owner[]> {
  const unitById = new Map(portfolio.units.map((u) => [u.id, u]));
  const map = new Map<string, Owner[]>();
  for (const owner of portfolio.owners) {
    const condoId = unitById.get(owner.unitId)?.condominiumId;
    if (!condoId) continue;
    const list = map.get(condoId) ?? [];
    list.push(owner);
    map.set(condoId, list);
  }
  return map;
}

export function ownersForCondo(
  portfolio: Portfolio,
  condominiumId: string,
): Owner[] {
  const unitIds = new Set(
    portfolio.units
      .filter((u) => u.condominiumId === condominiumId)
      .map((u) => u.id),
  );
  return portfolio.owners.filter((o) => unitIds.has(o.unitId));
}

/** Derived fee/occupancy/collection stats for a condominium. */
export function condoStatsFromOwners(
  condo: Condominium,
  owners: Owner[],
  quotas: QuotaPayment[] = [],
): CondoStats {
  const monthlyQuotas = owners.map((o) => o.monthlyQuota);
  const occupiedUnits = owners.length;

  if (monthlyQuotas.length === 0) {
    return {
      occupiedUnits,
      averageFee: 0,
      monthlyFeeRange: feeRange(0, 0),
      collectionRate: 0,
    };
  }

  const averageFee = roundCurrency(
    monthlyQuotas.reduce((sum, q) => sum + q, 0) / monthlyQuotas.length,
  );
  const ownerIds = new Set(owners.map((o) => o.id));
  let paid = 0;
  let total = 0;
  for (const q of quotas) {
    if (!ownerIds.has(q.ownerId)) continue;
    total += 1;
    if (q.status === "paid") paid += 1;
  }
  const collectionRate =
    total > 0 ? roundCurrency((paid / total) * 100) : 100;

  return {
    occupiedUnits,
    averageFee,
    monthlyFeeRange: feeRange(
      Math.min(...monthlyQuotas),
      Math.max(...monthlyQuotas),
    ),
    collectionRate,
  };
}

export function condoStats(
  condo: Condominium,
  portfolio: Portfolio,
  quotas: QuotaPayment[] = [],
): CondoStats {
  return condoStatsFromOwners(
    condo,
    ownersForCondo(portfolio, condo.id),
    quotas,
  );
}

export function breakdownFromStats(
  condo: Condominium,
  stats: CondoStats,
): CollectionBreakdown {
  const target = stats.averageFee * condo.numberOfUnits;
  const collected = target * (stats.collectionRate / 100);
  return {
    id: condo.id,
    name: condo.name,
    unitsCount: condo.numberOfUnits,
    collected: Math.round(collected),
    target: Math.round(target),
    collectionRate: stats.collectionRate,
    outstanding: Math.round(target - collected),
  };
}

export function summarizeCollection(
  propertyBreakdown: CollectionBreakdown[],
): CollectionSummaryData {
  const totalTarget = propertyBreakdown.reduce((s, p) => s + p.target, 0);
  const totalCollected = propertyBreakdown.reduce((s, p) => s + p.collected, 0);

  return {
    currentMonth: {
      totalTarget,
      totalCollected,
      collectionRate:
        propertyBreakdown.length > 0
          ? propertyBreakdown.reduce((s, p) => s + p.collectionRate, 0) /
            propertyBreakdown.length
          : 0,
      outstandingBalance: totalTarget - totalCollected,
      totalProperties: propertyBreakdown.length,
    },
    propertyBreakdown,
  };
}

export function collectionSummaryForCondo(
  condo: Condominium,
  stats: CondoStats,
): CollectionSummaryData {
  const row = breakdownFromStats(condo, stats);
  return {
    currentMonth: {
      totalTarget: row.target,
      totalCollected: row.collected,
      collectionRate: row.collectionRate,
      outstandingBalance: row.outstanding,
      totalProperties: 1,
    },
    propertyBreakdown: [row],
  };
}

export function buildCollectionFromPortfolio(
  portfolio: Portfolio,
  quotas: QuotaPayment[] = [],
): CollectionSummaryData {
  const byCondo = ownersByCondoId(portfolio);
  return summarizeCollection(
    portfolio.condominiums.map((condo) =>
      breakdownFromStats(
        condo,
        condoStatsFromOwners(condo, byCondo.get(condo.id) ?? [], quotas),
      ),
    ),
  );
}

export type OwnerDisplay = {
  unit: Unit | undefined;
  condominium: Condominium | undefined;
  unitLabel: string;
  condominiumId: string;
  condominiumName: string;
};

/** Resolve Unit + Condominium labels for a domain owner. */
export function ownerDisplay(
  portfolio: Portfolio,
  owner: Owner,
  unitById = new Map(portfolio.units.map((u) => [u.id, u])),
  condoById = new Map(portfolio.condominiums.map((c) => [c.id, c])),
): OwnerDisplay {
  const unit = unitById.get(owner.unitId);
  const condominium = unit ? condoById.get(unit.condominiumId) : undefined;
  return {
    unit,
    condominium,
    unitLabel: unit?.label ?? owner.unitId,
    condominiumId: condominium?.id ?? unit?.condominiumId ?? "",
    condominiumName: condominium?.name ?? "",
  };
}

/** Owner rows without quota balances (balances filled by collections). */
export function portfolioToOwnerRows(
  portfolio: Portfolio,
  avatars: Record<string, string> = {},
): OwnerRow[] {
  const unitById = new Map(portfolio.units.map((u) => [u.id, u]));
  const condoById = new Map(portfolio.condominiums.map((c) => [c.id, c]));
  return portfolio.owners.map((owner) => {
    const display = ownerDisplay(portfolio, owner, unitById, condoById);
    return {
      owner,
      unitLabel: display.unitLabel,
      condominiumId: display.condominiumId,
      condominiumName: display.condominiumName,
      paymentStatus: "" as const,
      currentBalance: 0,
      lastPayment: "",
      avatar: avatars[owner.id],
    };
  });
}

/**
 * Find a unit in a condominium by label, or build a new one.
 * Used when the owner modal only collects a free-text unit label.
 */
export function resolveOrCreateUnit(
  portfolio: Portfolio,
  condominiumId: string,
  unitLabel: string,
  existingUnitId?: string,
): Unit {
  const label = unitLabel.trim();
  if (existingUnitId) {
    const existing = portfolio.units.find((u) => u.id === existingUnitId);
    if (existing) {
      return {
        ...existing,
        condominiumId,
        label,
      };
    }
  }

  const match = portfolio.units.find(
    (u) =>
      u.condominiumId === condominiumId &&
      u.label.toLowerCase() === label.toLowerCase(),
  );
  if (match) return match;

  return {
    id: crypto.randomUUID(),
    condominiumId,
    label,
    floor: null,
    permillage: 0,
    type: "apartment",
    areaSqm: null,
  };
}

export function buildEmptyOwner(input: {
  fullName: string;
  email: string;
  phone: string;
  mailingAddress?: string | null;
  taxId?: string;
  unitId: string;
  unitPermillage?: number;
  monthlyQuota?: number;
  type?: Owner["type"];
}): Owner {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    contacts: {
      phone: input.phone.trim(),
      email: input.email.trim(),
      mailingAddress: input.mailingAddress?.trim() || null,
    },
    taxId: input.taxId?.trim() ?? "",
    unitId: input.unitId,
    unitPermillage: input.unitPermillage ?? 0,
    monthlyQuota: input.monthlyQuota ?? 0,
    type: input.type ?? "owner",
    documents: [],
    entryDate: today,
    exitDate: null,
  };
}

/** Apply owner-modal form fields onto a new or existing domain Owner + Unit. */
export function ownerFromFormSave(
  portfolio: Portfolio,
  data: {
    fullName: string;
    email: string;
    phone: string;
    unitLabel: string;
    condominiumId: string;
    mailingAddress?: string;
    monthlyQuota?: string;
    taxId?: string;
  },
  existing?: Owner,
): { owner: Owner; unit: Unit } {
  const unit = resolveOrCreateUnit(
    portfolio,
    data.condominiumId,
    data.unitLabel,
    existing?.unitId,
  );
  const parsedQuota = data.monthlyQuota ? parseFloat(data.monthlyQuota) : NaN;
  const monthlyQuota = Number.isFinite(parsedQuota)
    ? parsedQuota
    : (existing?.monthlyQuota ?? 0);

  if (existing) {
    return {
      unit,
      owner: {
        ...existing,
        fullName: data.fullName.trim(),
        contacts: {
          phone: data.phone.trim(),
          email: data.email.trim(),
          mailingAddress: data.mailingAddress?.trim() || null,
        },
        taxId: data.taxId?.trim() ?? existing.taxId,
        unitId: unit.id,
        unitPermillage: unit.permillage || existing.unitPermillage,
        monthlyQuota,
      },
    };
  }

  return {
    unit,
    owner: buildEmptyOwner({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      mailingAddress: data.mailingAddress,
      taxId: data.taxId,
      unitId: unit.id,
      unitPermillage: unit.permillage,
      monthlyQuota,
    }),
  };
}

export function buildEmptyCondominium(input: {
  name: string;
  street: string;
  postalCode: string;
  parish: string;
  municipality: string;
  taxId: string;
  numberOfUnits: number;
  deedDate?: string;
  propertyRegistryNumber?: string;
  commonAreas?: string[];
  buildingType?: Condominium["buildingType"];
  status?: Condominium["status"];
}): Condominium {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    address: {
      street: input.street.trim(),
      postalCode: input.postalCode.trim(),
      parish: input.parish.trim(),
      municipality: input.municipality.trim(),
    },
    taxId: input.taxId.trim(),
    deedDate: input.deedDate?.trim() || today,
    propertyRegistryNumber: input.propertyRegistryNumber?.trim() ?? "",
    numberOfUnits: input.numberOfUnits,
    totalPermillage: 1000,
    commonAreas: input.commonAreas ?? [],
    buildingType: input.buildingType ?? "mid-rise",
    status: input.status ?? "active",
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.0",
      date: today,
      file: null,
    },
  };
}

export { formatPortugueseAddress };

export const UNIT_TYPES: Unit["type"][] = [
  "apartment",
  "shop",
  "garage",
  "parking",
  "other",
];

export function parseUnitType(value: string): Unit["type"] {
  const normalized = value.trim().toLowerCase();
  if ((UNIT_TYPES as string[]).includes(normalized)) {
    return normalized as Unit["type"];
  }
  return "apartment";
}
