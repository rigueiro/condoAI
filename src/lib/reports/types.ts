export type ReportKind = "mapa-rateio" | "prestacao-contas" | "collection-aging";

export const REPORT_KINDS: ReportKind[] = [
  "mapa-rateio",
  "prestacao-contas",
  "collection-aging",
];

export const REPORT_TAB_KEYS: Record<
  ReportKind,
  "mapaRateio" | "prestacaoContas" | "collectionAging"
> = {
  "mapa-rateio": "mapaRateio",
  "prestacao-contas": "prestacaoContas",
  "collection-aging": "collectionAging",
};

export type AgingBucketId =
  | "current"
  | "1-30"
  | "31-60"
  | "61-90"
  | "90+";

export const AGING_BUCKETS: {
  id: AgingBucketId;
  minDays: number;
  maxDays: number | null;
}[] = [
  { id: "current", minDays: 0, maxDays: 0 },
  { id: "1-30", minDays: 1, maxDays: 30 },
  { id: "31-60", minDays: 31, maxDays: 60 },
  { id: "61-90", minDays: 61, maxDays: 90 },
  { id: "90+", minDays: 91, maxDays: null },
];

export type RateioRow = {
  unitId: string;
  unitLabel: string;
  unitType: string;
  floor: string | null;
  permillage: number;
  ownerNames: string[];
  monthlyQuota: number;
  annualShare: number;
  sharePercent: number;
};

export type RateioReport = {
  condominiumId: string;
  condominiumName: string;
  year: number;
  budgetStatus: "draft" | "approved" | null;
  collectable: number;
  monthlyTotal: number;
  totalPermillage: number;
  allocatedPermillage: number;
  totals: {
    monthly: number;
    annual: number;
    permillage: number;
  };
  rows: RateioRow[];
};

export type CategoryAmount = {
  category: string;
  amount: number;
};

export type PrestacaoReport = {
  condominiumId: string;
  condominiumName: string;
  year: number;
  budgetStatus: "draft" | "approved" | null;
  ordinary: CategoryAmount[];
  ordinaryTotal: number;
  reserveFund: number;
  minimumReserve: number;
  collectable: number;
  expensesByCategory: CategoryAmount[];
  expenseTotal: number;
  variance: number;
  bankAccounts: { bank: string; iban: string; balance: number }[];
  bankTotal: number;
  extraordinary: {
    id: string;
    description: string;
    date: string;
    totalAmount: number;
    ownerCount: number;
  }[];
  extraordinaryTotal: number;
  quotas: {
    paid: number;
    pending: number;
    overdue: number;
    paidAmount: number;
    outstandingAmount: number;
  };
};

export type AgingRow = {
  quotaId: string;
  ownerId: string;
  ownerName: string;
  condominiumId: string;
  condominiumName: string;
  unitLabel: string;
  monthYear: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
  bucket: AgingBucketId;
  status: "pending" | "overdue";
};

export type AgingBucketSummary = {
  id: AgingBucketId;
  count: number;
  amount: number;
};

export type AgingReport = {
  asOf: string;
  condominiumId: string | null;
  condominiumName: string | null;
  buckets: AgingBucketSummary[];
  totalCount: number;
  totalAmount: number;
  rows: AgingRow[];
};
