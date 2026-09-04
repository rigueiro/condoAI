import type { OccupancyRole, Owner } from "@/types";

export type PaymentStatus = "current" | "overdue" | "pending" | "agreement" | "";

export const PAYMENT_STATUS_STYLE: Record<
  Exclude<PaymentStatus, "">,
  { color: string; bg: string }
> = {
  current: { color: "text-success", bg: "bg-success-100" },
  pending: { color: "text-warning", bg: "bg-warning-100" },
  overdue: { color: "text-error", bg: "bg-error-100" },
  agreement: { color: "text-primary", bg: "bg-primary-100" },
};

export function paymentStatusStyle(status: PaymentStatus) {
  return status ? PAYMENT_STATUS_STYLE[status] : PAYMENT_STATUS_STYLE.current;
}

export function paymentStatusLabel(
  status: PaymentStatus,
): Exclude<PaymentStatus, ""> {
  return status || "current";
}

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
