import type { Condominium, QuotaPayment } from "@/types";
import { roundCurrency } from "@/lib/quota";
import { collectableBudgetTotal } from "@/lib/finance/budget";
import type { Portfolio } from "@/lib/portfolio/types";
import {
  breakdownFromStats,
  condoStats,
  ownerDisplay,
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

export const OWNER_AVATARS: Record<string, string> = {
  "1": "https://randomuser.me/api/portraits/women/32.jpg",
  "2": "https://randomuser.me/api/portraits/men/45.jpg",
  "3": "https://randomuser.me/api/portraits/women/28.jpg",
  "4": "https://randomuser.me/api/portraits/men/52.jpg",
  "5": "https://randomuser.me/api/portraits/women/35.jpg",
  "6": "https://randomuser.me/api/portraits/men/41.jpg",
  "7": "https://randomuser.me/api/portraits/men/33.jpg",
};

const ownerById = new Map(mockDomainOwners.map((o) => [o.id, o]));
const budgetByCondoId = new Map(
  approvedBudgetsForYear().map((b) => [b.condominiumId, b]),
);

/** Demo portfolio assembled from domain fixtures. */
export const mockPortfolio: Portfolio = {
  organization: null,
  condominiums: mockCondominiums,
  units: mockUnits,
  owners: mockDomainOwners,
  onboardingStep: "complete",
};

function feeRange(min: number, max: number): string {
  return `€${Math.round(min)} - €${Math.round(max)}`;
}

/** Demo-enriched condo stats (uses budgets when no owners yet). */
export function mockCondoStats(condo: Condominium): CondoStats {
  const estimatedOccupied = Math.round((condo.numberOfUnits ?? 0) * 0.92);
  const base = condoStats(condo, mockPortfolio, mockQuotaPayments);

  if (base.averageFee === 0 && base.occupiedUnits === 0) {
    const budget = budgetByCondoId.get(condo.id);
    const average =
      budget != null
        ? roundCurrency(
            collectableBudgetTotal(budget) /
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

  return {
    ...base,
    occupiedUnits: Math.max(base.occupiedUnits, estimatedOccupied),
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
  const display = owner ? ownerDisplay(mockPortfolio, owner) : undefined;
  const date =
    quota.paymentDate != null
      ? String(quota.paymentDate).slice(0, 10)
      : `${quota.monthYear}-01`;

  return {
    id: index + 1,
    date,
    ownerId: quota.ownerId,
    ownerName: owner?.fullName ?? "",
    property: display?.condominiumName ?? "",
    propertyId: display?.condominiumId,
    unit: display?.unitLabel ?? "",
    amount: quota.amount,
    paymentMethod: "Transferência bancária",
    status: QUOTA_TO_PAYMENT_STATUS[quota.status],
    receiptNumber: `RCP-${quota.monthYear.replace("-", "")}-${quota.id.toUpperCase()}`,
    timestamp: `${date}T10:30:00Z`,
    monthYear: quota.monthYear,
    quotaStatus: quota.status,
  };
}

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
