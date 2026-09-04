import type { QuotaPayment } from "@/types";

/** Extra fields captured when a manager records a payment. */
export interface PaymentDetails {
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  timestamp?: string;
}

export type ChargeKind =
  | "opening"
  | "charge"
  | "credit"
  | "extraordinary"
  | "mora";

export type PaymentAgreementStatus =
  | "active"
  | "completed"
  | "defaulted"
  | "cancelled";

export type InstallmentStatus = "pending" | "paid" | "overdue";

export interface PaymentInstallment {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt: string | null;
  receiptId: string | null;
}

export interface PaymentAgreement {
  id: string;
  number: string;
  ownerId: string;
  condominiumId: string;
  createdAt: string;
  startDate: string;
  status: PaymentAgreementStatus;
  principal: number;
  moraRateAnnual: number;
  moraAmount: number;
  total: number;
  installmentCount: number;
  notes: string | null;
  quotaIds: string[];
  moraChargeId: string | null;
  installments: PaymentInstallment[];
  defaultedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface AccountCharge {
  id: string;
  ownerId: string;
  condominiumId: string;
  date: string;
  kind: ChargeKind;
  description: string;
  amount: number;
}

export interface AccountReceipt {
  id: string;
  ownerId: string;
  condominiumId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  notes: string | null;
  year: number;
  sequence: number;
  number: string;
  quotaId: string | null;
}

export interface DebtCertificate {
  id: string;
  ownerId: string;
  condominiumId: string;
  issuedAt: string;
  asOfDate: string;
  year: number;
  sequence: number;
  number: string;
  totalDue: number;
}

export type LedgerSide = "debit" | "credit";

export type LedgerMovement = {
  id: string;
  date: string;
  side: LedgerSide;
  source: "quota" | "charge" | "receipt";
  description: string;
  amount: number;
  balance: number;
  receiptNumber?: string;
  receiptId?: string;
  quotaId?: string;
  chargeId?: string;
  chargeKind?: ChargeKind;
};

export interface CollectionsState {
  quotas: QuotaPayment[];
  details: Record<string, PaymentDetails>;
  charges: AccountCharge[];
  receipts: AccountReceipt[];
  certificates: DebtCertificate[];
  agreements: PaymentAgreement[];
  receiptSeqByYear: Record<string, number>;
  certificateSeqByYear: Record<string, number>;
  agreementSeqByYear: Record<string, number>;
}

export const EMPTY_COLLECTIONS: CollectionsState = {
  quotas: [],
  details: {},
  charges: [],
  receipts: [],
  certificates: [],
  agreements: [],
  receiptSeqByYear: {},
  certificateSeqByYear: {},
  agreementSeqByYear: {},
};

export type RecordPaymentInput = {
  ownerId: string;
  amount: number | string;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  /** Prefer matching a specific overdue/pending quota when known. */
  quotaId?: string;
};

export type AddChargeInput = {
  ownerId: string;
  condominiumId?: string;
  date?: string;
  kind?: string;
  description?: string;
  amount: number | string;
};

export type IssueCertificateInput = {
  ownerId: string;
  condominiumId?: string;
  asOfDate?: string;
};

export type CreateAgreementInput = {
  ownerId: string;
  condominiumId?: string;
  startDate?: string;
  installmentCount: number | string;
  includeMora?: boolean;
  moraRateAnnual?: number | string;
  notes?: string;
};

export type PayInstallmentInput = {
  agreementId: string;
  installmentId: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
};

/** Overdue row shown on the manager dashboard daily job. */
export type OverdueItem = {
  id: string;
  ownerId?: string;
  ownerName: string;
  email?: string;
  phone?: string;
  unit: string;
  property: string;
  propertyId?: string;
  amount: number;
  /** ISO date string for when the quota was due */
  dueDate: string;
  monthYear?: string;
};

export type ReminderRecipient = {
  id: string;
  email: string;
  phone: string;
  ownerName: string;
  unit: string;
  property: string;
  amount: number;
  monthYear?: string;
  /** ISO due date — used for escalation eligibility. */
  dueDate?: string;
};

export type ReminderStage = "reminder" | "escalation";

export type ContactAttempt = {
  quotaId: string;
  channel: "email" | "sms";
  stage: ReminderStage;
  at: string;
};

export type ReminderCopy = {
  subjectOne: string;
  bodyOne: (r: ReminderRecipient) => string;
  smsReminder: (r: ReminderRecipient) => string;
  escalationSubject: string;
  escalationBody: (r: ReminderRecipient) => string;
  smsEscalation: (r: ReminderRecipient) => string;
  digestSubject: (count: number) => string;
  digestBody: (recipients: ReminderRecipient[]) => string;
};
