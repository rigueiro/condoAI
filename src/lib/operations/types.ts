import type { Equipment, MaintenanceContract, Vendor } from "@/types";

export interface OperationsState {
  vendors: Vendor[];
  contracts: MaintenanceContract[];
  equipment: Equipment[];
}

export const EMPTY_OPERATIONS: OperationsState = {
  vendors: [],
  contracts: [],
  equipment: [],
};

export type OperationsKind = "vendor" | "contract" | "equipment";

export type OperationsTab = OperationsKind;

/** Contract ending soon / expired row for the Contracts tab banner. */
export type ContractAttentionItem = {
  id: string;
  condominiumId: string;
  condominiumName: string;
  vendorName: string;
  service: string;
  endDate: string;
  /** Negative = already past end. */
  daysUntil: number;
  urgency: "overdue" | "due-soon";
};
