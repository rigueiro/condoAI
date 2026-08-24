import type { OccupancyRole, Owner } from "@/types";

export type PaymentStatus = "current" | "overdue" | "pending" | "";

export type OwnerOccupancyView = {
  unitId: string;
  unitLabel: string;
  condominiumId: string;
  condominiumName: string;
  role: OccupancyRole;
};

/** Derived list/detail row: domain Owner + occupancy joins + quota balances. */
export type OwnerRow = {
  owner: Owner;
  unitLabel: string;
  condominiumId: string;
  condominiumIds: string[];
  condominiumName: string;
  occupancies: OwnerOccupancyView[];
  unitPermillage: number;
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
