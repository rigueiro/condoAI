import { formatPortugueseAddress } from "@/lib/address";
import type { Property } from "@/app/[locale]/properties-management/types";
import type {
  Owner as OwnerView,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import type { Condominium, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";

const COMMON_AREA_LABELS: Record<string, string> = {
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
};

function feeRange(min: number, max: number): string {
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

export function portfolioToPropertyViews(portfolio: Portfolio): Property[] {
  const ownersByCondo = new Map<string, Owner[]>();
  const unitById = new Map(portfolio.units.map((u) => [u.id, u]));

  for (const owner of portfolio.owners) {
    const condoId = unitById.get(owner.unitId)?.condominiumId;
    if (!condoId) continue;
    const list = ownersByCondo.get(condoId) ?? [];
    list.push(owner);
    ownersByCondo.set(condoId, list);
  }

  return portfolio.condominiums.map((condo) =>
    toPropertyView(condo, ownersByCondo.get(condo.id) ?? []),
  );
}

function toPropertyView(condo: Condominium, owners: Owner[]): Property {
  const quotas = owners.map((o) => o.monthlyQuota);
  const averageFee =
    quotas.length > 0
      ? quotas.reduce((sum, q) => sum + q, 0) / quotas.length
      : 0;
  const min = quotas.length > 0 ? Math.min(...quotas) : 0;
  const max = quotas.length > 0 ? Math.max(...quotas) : 0;

  return {
    id: condo.id,
    name: condo.name,
    address: formatPortugueseAddress(condo.address),
    totalUnits: Math.max(condo.numberOfUnits, owners.length),
    occupiedUnits: owners.length,
    monthlyFeeRange: feeRange(min, max),
    averageFee: Math.round(averageFee * 100) / 100,
    collectionRate: owners.length > 0 ? 0 : 0,
    amenities: condo.commonAreas.map(
      (area) => COMMON_AREA_LABELS[area] ?? area,
    ),
    buildingType: "Condominium",
    yearBuilt: new Date(condo.deedDate).getFullYear() || new Date().getFullYear(),
    status: "Active",
    lastUpdated: String(condo.internalRegulations.date).slice(0, 10),
    taxId: condo.taxId,
    totalPermillage: condo.totalPermillage,
  };
}

export function portfolioToOwnerViews(portfolio: Portfolio): OwnerView[] {
  const unitById = new Map(portfolio.units.map((u) => [u.id, u]));
  const condoById = new Map(portfolio.condominiums.map((c) => [c.id, c]));

  return portfolio.owners.map((owner) => {
    const unit = unitById.get(owner.unitId);
    const condo = unit ? condoById.get(unit.condominiumId) : undefined;
    const paymentStatus: PaymentStatus = "";

    return {
      id: owner.id,
      name: owner.fullName,
      email: owner.contacts.email,
      phone: owner.contacts.phone,
      unit: unit?.label ?? owner.unitId,
      property: condo?.name ?? "",
      propertyId: condo?.id ?? "",
      paymentStatus,
      currentBalance: 0,
      lastPayment: "",
      joinDate: String(owner.entryDate).slice(0, 10),
      emergencyContact: owner.contacts.mailingAddress ?? undefined,
      monthlyFee: String(owner.monthlyQuota),
      taxId: owner.taxId,
      unitPermillage: owner.unitPermillage,
      monthlyQuota: owner.monthlyQuota,
    };
  });
}

export function buildEmptyCondominium(input: {
  name: string;
  street: string;
  postalCode: string;
  parish: string;
  municipality: string;
  taxId: string;
  numberOfUnits: number;
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
    deedDate: today,
    propertyRegistryNumber: "",
    numberOfUnits: input.numberOfUnits,
    totalPermillage: 1000,
    commonAreas: [],
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.0",
      date: today,
      file: null,
    },
  };
}

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
