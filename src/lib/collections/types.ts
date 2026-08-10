import type { QuotaPayment } from "@/types";

/** Extra fields captured when a manager records a payment. */
export interface PaymentDetails {
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  timestamp?: string;
}

export interface CollectionsState {
  quotas: QuotaPayment[];
  details: Record<string, PaymentDetails>;
}

export const EMPTY_COLLECTIONS: CollectionsState = {
  quotas: [],
  details: {},
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
