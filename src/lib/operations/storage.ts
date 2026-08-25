import type { Equipment, MaintenanceContract, Vendor } from "@/types";
import type { OperationsState } from "./types";

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((i) => i.id !== id);
}

export function upsertVendor(
  state: OperationsState,
  vendor: Vendor,
): OperationsState {
  return { ...state, vendors: upsertById(state.vendors, vendor) };
}

/** Returns null when the vendor still has contracts. */
export function removeVendor(
  state: OperationsState,
  id: string,
): OperationsState | null {
  if (state.contracts.some((c) => c.vendorId === id)) return null;
  return { ...state, vendors: removeById(state.vendors, id) };
}

export function upsertContract(
  state: OperationsState,
  contract: MaintenanceContract,
): OperationsState {
  return { ...state, contracts: upsertById(state.contracts, contract) };
}

export function removeContract(
  state: OperationsState,
  id: string,
): OperationsState {
  return { ...state, contracts: removeById(state.contracts, id) };
}

export function upsertEquipment(
  state: OperationsState,
  equipment: Equipment,
): OperationsState {
  return {
    ...state,
    equipment: upsertById(state.equipment, equipment),
  };
}

export function removeEquipment(
  state: OperationsState,
  id: string,
): OperationsState {
  return { ...state, equipment: removeById(state.equipment, id) };
}
