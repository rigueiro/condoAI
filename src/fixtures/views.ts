import type { Condominium, Owner, QuotaPayment } from "@/types";
import { formatPortugueseAddress } from "@/lib/address";
import { roundCurrency, sumBudgetCategories } from "@/lib/quota";
import type { Property } from "@/app/[locale]/properties-management/types";
import type {
  Owner as OwnerView,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import {
  mockAnnualBudgets,
  mockCondominiums,
  mockDomainOwners,
  mockQuotaPayments,
  mockUnits,
} from "./domain";

export interface PaymentView {
  id: number;
  date: string;
  ownerId?: string;
  ownerName: string;
  property: string;
  propertyId?: string;
  unit: string;
  amount: number;
  paymentMethod: string;
  status: "completed" | "pending" | "failed" | "disputed";
  receiptNumber: string;
  timestamp: string;
  monthYear?: string;
  quotaStatus?: "paid" | "pending" | "overdue";
}

const AVATARS: Record<string, string> = {
  "1": "https://randomuser.me/api/portraits/women/32.jpg",
  "2": "https://randomuser.me/api/portraits/men/45.jpg",
  "3": "https://randomuser.me/api/portraits/women/28.jpg",
  "4": "https://randomuser.me/api/portraits/men/52.jpg",
  "5": "https://randomuser.me/api/portraits/women/35.jpg",
  "6": "https://randomuser.me/api/portraits/men/41.jpg",
};

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

const unitById = new Map(mockUnits.map((u) => [u.id, u]));
const condoById = new Map(mockCondominiums.map((c) => [c.id, c]));
const ownerById = new Map(mockDomainOwners.map((o) => [o.id, o]));
const budgetByCondoId = new Map(
  mockAnnualBudgets.map((b) => [b.condominiumId, b]),
);

const quotasByOwnerId = mockQuotaPayments.reduce((map, quota) => {
  const list = map.get(quota.ownerId) ?? [];
  list.push(quota);
  map.set(quota.ownerId, list);
  return map;
}, new Map<string, QuotaPayment[]>());

const ownersByCondoId = mockDomainOwners.reduce((map, owner) => {
  const condoId = unitById.get(owner.unitId)?.condominiumId;
  if (!condoId) return map;
  const list = map.get(condoId) ?? [];
  list.push(owner);
  map.set(condoId, list);
  return map;
}, new Map<string, Owner[]>());

function derivePaymentStatus(ownerId: string): PaymentStatus {
  const quotas = quotasByOwnerId.get(ownerId) ?? [];
  if (quotas.some((q) => q.status === "overdue")) return "overdue";
  if (quotas.some((q) => q.status === "pending")) return "pending";
  if (quotas.length === 0) return "";
  return "current";
}

function deriveBalance(ownerId: string): number {
  return (quotasByOwnerId.get(ownerId) ?? [])
    .filter((q) => q.status === "overdue" || q.status === "pending")
    .reduce((sum, q) => sum + q.amount, 0);
}

function lastPaidDate(ownerId: string): string {
  return (
    (quotasByOwnerId.get(ownerId) ?? [])
      .filter((q) => q.status === "paid" && q.paymentDate)
      .map((q) => String(q.paymentDate))
      .sort()
      .at(-1) ?? ""
  );
}

function feeRange(min: number, max: number): string {
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

function quotaStatsForCondo(condominiumId: string) {
  const condo = condoById.get(condominiumId);
  const estimatedOccupied = Math.round((condo?.numberOfUnits ?? 0) * 0.92);
  const owners = ownersByCondoId.get(condominiumId) ?? [];
  const quotas = owners.map((o) => o.monthlyQuota);

  if (quotas.length === 0) {
    const budget = budgetByCondoId.get(condominiumId);
    const average =
      budget != null
        ? roundCurrency(
            sumBudgetCategories(budget.valuesByCategory) /
              12 /
              (condo?.numberOfUnits || 1),
          )
        : 0;
    return {
      averageFee: average,
      monthlyFeeRange: feeRange(average, average),
      collectionRate: 88.9,
      occupiedUnits: estimatedOccupied,
    };
  }

  const allQuotas = owners.flatMap((o) => quotasByOwnerId.get(o.id) ?? []);
  const paid = allQuotas.filter((q) => q.status === "paid").length;

  return {
    averageFee: roundCurrency(
      quotas.reduce((sum, q) => sum + q, 0) / quotas.length,
    ),
    monthlyFeeRange: feeRange(Math.min(...quotas), Math.max(...quotas)),
    collectionRate:
      allQuotas.length > 0
        ? roundCurrency((paid / allQuotas.length) * 100)
        : 100,
    occupiedUnits: Math.max(owners.length, estimatedOccupied),
  };
}

/** UI Property view derived from Condominium + units/owners/quotas. */
export function toPropertyView(condo: Condominium): Property {
  const stats = quotaStatsForCondo(condo.id);
  return {
    id: condo.id,
    name: condo.name,
    address: formatPortugueseAddress(condo.address),
    totalUnits: condo.numberOfUnits,
    occupiedUnits: stats.occupiedUnits,
    monthlyFeeRange: stats.monthlyFeeRange,
    averageFee: stats.averageFee,
    collectionRate: stats.collectionRate,
    amenities: condo.commonAreas.map(
      (area) => COMMON_AREA_LABELS[area] ?? area,
    ),
    buildingType: "Condominium",
    yearBuilt: new Date(condo.deedDate).getFullYear(),
    status: "Active",
    lastUpdated: String(condo.internalRegulations.date).slice(0, 10),
    taxId: condo.taxId,
    totalPermillage: condo.totalPermillage,
  };
}

/** UI Owner view derived from domain Owner + Unit + QuotaPayment. */
export function toOwnerView(owner: Owner): OwnerView {
  const unit = unitById.get(owner.unitId);
  const condo = unit ? condoById.get(unit.condominiumId) : undefined;

  return {
    id: owner.id,
    name: owner.fullName,
    email: owner.contacts.email,
    phone: owner.contacts.phone,
    unit: unit?.label ?? owner.unitId,
    property: condo?.name ?? "",
    propertyId: condo?.id ?? "",
    paymentStatus: derivePaymentStatus(owner.id),
    currentBalance: deriveBalance(owner.id),
    lastPayment: lastPaidDate(owner.id),
    avatar: AVATARS[owner.id],
    joinDate: String(owner.entryDate).slice(0, 10),
    emergencyContact: owner.contacts.mailingAddress ?? undefined,
    monthlyFee: String(owner.monthlyQuota),
    taxId: owner.taxId,
    unitPermillage: owner.unitPermillage,
    monthlyQuota: owner.monthlyQuota,
  };
}

const QUOTA_TO_PAYMENT_STATUS: Record<
  QuotaPayment["status"],
  PaymentView["status"]
> = {
  paid: "completed",
  pending: "pending",
  overdue: "failed",
};

/** UI payment row derived from QuotaPayment. */
export function toPaymentView(
  quota: QuotaPayment,
  index: number,
): PaymentView {
  const owner = ownerById.get(quota.ownerId);
  const unit = owner ? unitById.get(owner.unitId) : undefined;
  const condo = unit ? condoById.get(unit.condominiumId) : undefined;
  const date =
    quota.paymentDate != null
      ? String(quota.paymentDate).slice(0, 10)
      : `${quota.monthYear}-01`;

  return {
    id: index + 1,
    date,
    ownerId: quota.ownerId,
    ownerName: owner?.fullName ?? "",
    property: condo?.name ?? "",
    propertyId: condo?.id,
    unit: unit?.label ?? "",
    amount: quota.amount,
    paymentMethod: "Transferência bancária",
    status: QUOTA_TO_PAYMENT_STATUS[quota.status],
    receiptNumber: `RCP-${quota.monthYear.replace("-", "")}-${quota.id.toUpperCase()}`,
    timestamp: `${date}T10:30:00Z`,
    monthYear: quota.monthYear,
    quotaStatus: quota.status,
  };
}

export const mockProperties: Property[] =
  mockCondominiums.map(toPropertyView);

export const mockOwners: OwnerView[] = mockDomainOwners.map(toOwnerView);

export const mockPayments: PaymentView[] =
  mockQuotaPayments.map(toPaymentView);

/** Portfolio collection aggregates for payment/report screens. */
export function buildCollectionFromProperties(properties: Property[]) {
  const propertyBreakdown = properties.map((p, index) => {
    const target = p.averageFee * p.totalUnits;
    const collected = target * (p.collectionRate / 100);
    return {
      id: index + 1,
      name: p.name,
      unitsCount: p.totalUnits,
      collected: Math.round(collected),
      target: Math.round(target),
      collectionRate: p.collectionRate,
      outstanding: Math.round(target - collected),
    };
  });

  const totalTarget = propertyBreakdown.reduce((s, p) => s + p.target, 0);
  const totalCollected = propertyBreakdown.reduce((s, p) => s + p.collected, 0);

  return {
    currentMonth: {
      totalTarget,
      totalCollected,
      collectionRate:
        properties.length > 0
          ? properties.reduce((s, p) => s + p.collectionRate, 0) /
            properties.length
          : 0,
      outstandingBalance: totalTarget - totalCollected,
      totalProperties: properties.length,
    },
    propertyBreakdown,
  };
}
