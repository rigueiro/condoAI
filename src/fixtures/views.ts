import type { Condominium, Owner, QuotaPayment } from "@/types";
import { roundCurrency, sumBudgetCategories } from "@/lib/quota";
import type {
  Owner as OwnerView,
  PaymentStatus,
} from "@/app/[locale]/owners-management/components/types";
import type { Portfolio } from "@/lib/portfolio/types";
import {
  breakdownFromStats,
  condoStatsFromOwners,
  summarizeCollection,
  type CondoStats,
  type CollectionSummaryData,
} from "@/lib/portfolio/mappers";
import {
  approvedBudgetsForYear,
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

const unitById = new Map(mockUnits.map((u) => [u.id, u]));
const condoById = new Map(mockCondominiums.map((c) => [c.id, c]));
const ownerById = new Map(mockDomainOwners.map((o) => [o.id, o]));
const budgetByCondoId = new Map(
  approvedBudgetsForYear().map((b) => [b.condominiumId, b]),
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

/** Demo portfolio assembled from domain fixtures. */
export const mockPortfolio: Portfolio = {
  organization: null,
  condominiums: mockCondominiums,
  units: mockUnits,
  owners: mockDomainOwners,
  onboardingStep: "complete",
};

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

/** Demo-enriched condo stats (uses budgets when no owners yet). */
export function mockCondoStats(condo: Condominium): CondoStats {
  const estimatedOccupied = Math.round((condo.numberOfUnits ?? 0) * 0.92);
  const owners = ownersByCondoId.get(condo.id) ?? [];
  const quotas = owners.map((o) => o.monthlyQuota);

  if (quotas.length === 0) {
    const budget = budgetByCondoId.get(condo.id);
    const average =
      budget != null
        ? roundCurrency(
            sumBudgetCategories(budget.valuesByCategory) /
              12 /
              (condo.numberOfUnits || 1),
          )
        : 0;
    return {
      averageFee: average,
      monthlyFeeRange: feeRange(average, average),
      collectionRate: 88.9,
      occupiedUnits: estimatedOccupied,
    };
  }

  const base = condoStatsFromOwners(condo, owners, mockQuotaPayments);
  return {
    ...base,
    occupiedUnits: Math.max(base.occupiedUnits, estimatedOccupied),
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

export const mockOwners: OwnerView[] = mockDomainOwners.map(toOwnerView);

export const mockPayments: PaymentView[] =
  mockQuotaPayments.map(toPaymentView);

/** Demo collection aggregates from the mock portfolio. */
export function buildMockCollectionSummary(): CollectionSummaryData {
  return summarizeCollection(
    mockCondominiums.map((condo) =>
      breakdownFromStats(condo, mockCondoStats(condo)),
    ),
  );
}

export type { CondoStats, CollectionSummaryData };
