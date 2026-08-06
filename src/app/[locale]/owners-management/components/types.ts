import type { Owner } from "@/types";

export type PaymentStatus = "current" | "overdue" | "pending" | "";

/** Derived list/detail row: domain Owner + Unit/Condo joins + quota balances. */
export type OwnerRow = {
  owner: Owner;
  unitLabel: string;
  condominiumId: string;
  condominiumName: string;
  paymentStatus: PaymentStatus;
  currentBalance: number;
  lastPayment: string;
  avatar?: string;
};

export type SortConfig = {
  key:
    | "fullName"
    | "unitLabel"
    | "condominiumName"
    | "currentBalance"
    | "paymentStatus"
    | "lastPayment";
  direction: "asc" | "desc";
};
