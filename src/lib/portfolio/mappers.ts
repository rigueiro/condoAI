import { formatPortugueseAddress } from "@/lib/address";
import { roundCurrency } from "@/lib/quota";
import type {
  OwnerOccupancyView,
  OwnerRow,
} from "@/app/[locale]/owners-management/components/types";
import type { Condominium, Owner, QuotaPayment } from "@/types";
import {
  indexOccupanciesByOwnerId,
  occupanciesForOwner,
  type OccupancyLink,
  type OccupancyOnUnit,
} from "./occupancy";
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
  const map = new Map<string, Owner[]>();
  const ownerById = new Map(portfolio.owners.map((owner) => [owner.id, owner]));
  const seen = new Map<string, Set<string>>();
  for (const unit of portfolio.units) {
    for (const occupancy of unit.occupancies ?? []) {
      const owner = ownerById.get(occupancy.ownerId);
      if (!owner) continue;
      const ids = seen.get(unit.condominiumId) ?? new Set();
      if (ids.has(owner.id)) continue;
      ids.add(owner.id);
      seen.set(unit.condominiumId, ids);
      const list = map.get(unit.condominiumId) ?? [];
      list.push(owner);
      map.set(unit.condominiumId, list);
    }
  }
  return map;
}

export function ownersForCondo(
  portfolio: Portfolio,
  condominiumId: string,
): Owner[] {
  return ownersByCondoId(portfolio).get(condominiumId) ?? [];
}

/** Derived fee/occupancy/collection stats for a condominium. */
export function condoStatsFromOwners(
  condo: Condominium,
  owners: Owner[],
  quotas: QuotaPayment[] = [],
  occupiedUnits = owners.length,
): CondoStats {
  const billed = owners.filter((owner) => owner.monthlyQuota > 0);
  const monthlyQuotas = billed.map((o) => o.monthlyQuota);

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
  const occupiedUnits = portfolio.units.filter(
    (unit) =>
      unit.condominiumId === condo.id && (unit.occupancies ?? []).length > 0,
  ).length;
  return condoStatsFromOwners(
    condo,
    ownersForCondo(portfolio, condo.id),
    quotas,
    occupiedUnits,
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
  return summarizeCollection(
    portfolio.condominiums.map((condo) =>
      breakdownFromStats(condo, condoStats(condo, portfolio, quotas)),
    ),
  );
}

export type OwnerDisplay = {
  occupancies: OwnerOccupancyView[];
  unitLabel: string;
  condominiumId: string;
  condominiumIds: string[];
  condominiumName: string;
  unitPermillage: number;
};

function occupancyViews(
  links: OccupancyOnUnit[],
  condoById: Map<string, Condominium>,
): OwnerOccupancyView[] {
  return links.map(({ unit, role }) => ({
    unitId: unit.id,
    unitLabel: unit.label,
    condominiumId: unit.condominiumId,
    condominiumName: condoById.get(unit.condominiumId)?.name ?? "",
    role,
  }));
}

/** Resolve occupancy joins for a domain person. */
export function ownerDisplay(
  portfolio: Portfolio,
  owner: Owner,
  condoById = new Map(portfolio.condominiums.map((c) => [c.id, c])),
  linksByOwner?: Map<string, OccupancyOnUnit[]>,
): OwnerDisplay {
  const links = occupanciesForOwner(portfolio.units, owner.id, linksByOwner);
  const occupancies = occupancyViews(links, condoById);
  const first = occupancies[0];
  const condominiumIds = [
    ...new Set(occupancies.map((item) => item.condominiumId)),
  ];
  const names = [
    ...new Set(
      occupancies
        .map((item) => item.condominiumName)
        .filter((name) => name.length > 0),
    ),
  ];

  return {
    occupancies,
    unitLabel: occupancies.map((item) => item.unitLabel).join(", ") || "—",
    condominiumId: first?.condominiumId ?? "",
    condominiumIds,
    condominiumName: names.join(", "),
    unitPermillage: links
      .filter((item) => item.role === "owner")
      .reduce((sum, item) => sum + item.unit.permillage, 0),
  };
}

/** Owner rows without quota balances (balances filled by collections). */
export function portfolioToOwnerRows(
  portfolio: Portfolio,
  avatars: Record<string, string> = {},
): OwnerRow[] {
  const condoById = new Map(portfolio.condominiums.map((c) => [c.id, c]));
  const linksByOwner = indexOccupanciesByOwnerId(portfolio.units);
  return portfolio.owners.map((owner) => {
    const display = ownerDisplay(portfolio, owner, condoById, linksByOwner);
    return {
      owner,
      ...display,
      paymentStatus: "" as const,
      currentBalance: 0,
      lastPayment: "",
      avatar: avatars[owner.id],
    };
  });
}

export function buildEmptyOwner(input: {
  fullName: string;
  email: string;
  phone: string;
  mailingAddress?: string | null;
  taxId?: string;
  monthlyQuota?: number;
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
    monthlyQuota: input.monthlyQuota ?? 0,
    documents: [],
    entryDate: today,
    exitDate: null,
  };
}

/** Apply owner-modal form fields onto a person and their occupancy links. */
export function ownerFromFormSave(
  data: {
    fullName: string;
    email: string;
    phone: string;
    mailingAddress?: string;
    monthlyQuota?: string;
    taxId?: string;
    occupancies: OccupancyLink[];
  },
  existing?: Owner,
): { owner: Owner; occupancies: OccupancyLink[] } {
  const parsedQuota = data.monthlyQuota ? parseFloat(data.monthlyQuota) : NaN;
  const monthlyQuota = Number.isFinite(parsedQuota)
    ? parsedQuota
    : (existing?.monthlyQuota ?? 0);
  const occupancies = data.occupancies
    .filter((row) => row.unitId)
    .map((row) => ({ unitId: row.unitId, role: row.role }));

  if (existing) {
    return {
      occupancies,
      owner: {
        ...existing,
        fullName: data.fullName.trim(),
        contacts: {
          phone: data.phone.trim(),
          email: data.email.trim(),
          mailingAddress: data.mailingAddress?.trim() || null,
        },
        taxId: data.taxId?.trim() ?? existing.taxId,
        monthlyQuota,
      },
    };
  }

  return {
    occupancies,
    owner: buildEmptyOwner({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      mailingAddress: data.mailingAddress,
      taxId: data.taxId,
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

export { UNIT_TYPES, parseUnitType } from "./units";
