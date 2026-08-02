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
  ownerName: string;
  unit: string;
  property: string;
  amount: number;
  monthYear?: string;
};

export type ReminderCopy = {
  subjectOne: string;
  subjectMany: string;
  bodyOne: (r: ReminderRecipient) => string;
  bodyMany: (recipients: ReminderRecipient[]) => string;
};
