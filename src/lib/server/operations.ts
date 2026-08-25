import type { Equipment, MaintenanceContract, Vendor } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  removeContract,
  removeEquipment,
  removeVendor,
  upsertContract,
  upsertEquipment,
  upsertVendor,
} from "@/lib/operations/storage";
import {
  EMPTY_OPERATIONS,
  type OperationsState,
} from "@/lib/operations/types";
import { buildDemoOperations } from "./demo";
import { readStore, writeStore } from "./store";

function normalizeOperations(parsed: OperationsState): OperationsState {
  return {
    vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
    contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
    equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
  };
}

function loadOrSeedOperations(email: string): {
  key: string;
  state: OperationsState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().operations[key];
  if (existing) {
    return { key, state: normalizeOperations(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoOperations(), seeded: true };
  }
  return { key, state: { ...EMPTY_OPERATIONS }, seeded: false };
}

/** Load operations. Seeds demo fixtures when missing. */
export function getOperations(email: string): OperationsState {
  const { key, state, seeded } = loadOrSeedOperations(email);
  if (seeded) {
    const store = readStore();
    store.operations[key] = state;
    writeStore(store);
  }
  return state;
}

/** Single read→mutate→write, including first-touch demo seed. */
function mutateOperations(
  email: string,
  mutator: (current: OperationsState) => OperationsState,
): OperationsState {
  const { key, state } = loadOrSeedOperations(email);
  const next = normalizeOperations(mutator(state));
  const store = readStore();
  store.operations[key] = next;
  writeStore(store);
  return next;
}

export function putVendor(email: string, vendor: Vendor): OperationsState {
  return mutateOperations(email, (current) => upsertVendor(current, vendor));
}

/** Throws `vendorInUse` when linked contracts, expenses, or occurrences exist. */
export function deleteVendor(email: string, id: string): OperationsState {
  const key = email.trim().toLowerCase();
  const store = readStore();
  const { state } = loadOrSeedOperations(email);
  const inUse =
    state.contracts.some((c) => c.vendorId === id) ||
    store.finance[key]?.expenses.some((e) => e.vendorId === id) ||
    store.occurrences[key]?.occurrences.some((o) => o.vendorId === id);

  if (inUse) throw new Error("vendorInUse");

  return mutateOperations(email, (current) => {
    const next = removeVendor(current, id);
    if (!next) throw new Error("vendorInUse");
    return next;
  });
}

export function putContract(
  email: string,
  contract: MaintenanceContract,
): OperationsState {
  return mutateOperations(email, (current) =>
    upsertContract(current, contract),
  );
}

export function deleteContract(email: string, id: string): OperationsState {
  return mutateOperations(email, (current) => removeContract(current, id));
}

export function putEquipment(
  email: string,
  equipment: Equipment,
): OperationsState {
  return mutateOperations(email, (current) =>
    upsertEquipment(current, equipment),
  );
}

export function deleteEquipment(email: string, id: string): OperationsState {
  return mutateOperations(email, (current) => removeEquipment(current, id));
}
