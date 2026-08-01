export type PaymentStatus = "current" | "overdue" | "pending" | "";

export type Owner = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  unit: string;
  property: string;
  propertyId: string;
  paymentStatus: PaymentStatus;
  currentBalance: number;
  lastPayment: string; // ISO date string
  avatar?: string;
  joinDate: string; // ISO date string
  emergencyContact?: string;
  monthlyFee?: string;
  /** Owner NIF (from domain) */
  taxId?: string;
  /** Unit permillage (‰) */
  unitPermillage?: number;
  /** Auto-calculated monthly quota in EUR */
  monthlyQuota?: number;
};
