"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { Equipment, MaintenanceContract, Vendor } from "@/types";
import {
  EMPTY_OPERATIONS,
  type ContractAttentionItem,
  type OperationsState,
} from "./types";
import { buildContractAttentionItems } from "./views";

interface OperationsContextValue {
  isReady: boolean;
  vendors: Vendor[];
  contracts: MaintenanceContract[];
  equipment: Equipment[];
  contractAttention: ContractAttentionItem[];
  upsertVendor: (vendor: Vendor) => void;
  removeVendor: (id: string) => Promise<boolean>;
  upsertContract: (contract: MaintenanceContract) => void;
  removeContract: (id: string) => void;
  upsertEquipment: (equipment: Equipment) => void;
  removeEquipment: (id: string) => void;
  refresh: () => void;
}

const OperationsContext = createContext<OperationsContextValue | undefined>(
  undefined,
);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { portfolio } = usePortfolio();

  const [state, setState] = useState<OperationsState>(EMPTY_OPERATIONS);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_OPERATIONS);
  }

  useEffect(() => {
    if (!email) return;
    const key = `${email}:${refreshNonce}`;
    if (loadedKey === key) return;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ state: OperationsState }>(
          "/api/operations",
        );
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_OPERATIONS);
        setLoadedKey(key);
      } finally {
        if (inFlightRef.current === key) {
          inFlightRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, loadedKey, refreshNonce]);

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_OPERATIONS);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchOperations = useCallback(
    async (body: Record<string, unknown>) => {
      const data = await apiFetch<{ state: OperationsState }>(
        "/api/operations",
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      setState(data.state);
    },
    [],
  );

  const contractAttention = useMemo(
    () => buildContractAttentionItems(state, portfolio.condominiums),
    [state, portfolio.condominiums],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<OperationsContextValue>(
    () => ({
      isReady,
      vendors: state.vendors,
      contracts: state.contracts,
      equipment: state.equipment,
      contractAttention,
      upsertVendor: (vendor) => {
        void patchOperations({ action: "upsertVendor", vendor }).catch(
          () => undefined,
        );
      },
      removeVendor: async (id) => {
        try {
          await patchOperations({ action: "removeVendor", id });
          return true;
        } catch (err) {
          if (err instanceof ApiError && err.message === "vendorHasContracts") {
            return false;
          }
          return false;
        }
      },
      upsertContract: (contract) => {
        void patchOperations({ action: "upsertContract", contract }).catch(
          () => undefined,
        );
      },
      removeContract: (id) => {
        void patchOperations({ action: "removeContract", id }).catch(
          () => undefined,
        );
      },
      upsertEquipment: (equipment) => {
        void patchOperations({ action: "upsertEquipment", equipment }).catch(
          () => undefined,
        );
      },
      removeEquipment: (id) => {
        void patchOperations({ action: "removeEquipment", id }).catch(
          () => undefined,
        );
      },
      refresh,
    }),
    [
      isReady,
      state.vendors,
      state.contracts,
      state.equipment,
      contractAttention,
      patchOperations,
      refresh,
    ],
  );

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations(): OperationsContextValue {
  const ctx = useContext(OperationsContext);
  if (!ctx) {
    throw new Error("useOperations must be used within OperationsProvider");
  }
  return ctx;
}
