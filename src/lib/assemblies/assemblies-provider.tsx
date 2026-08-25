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
import { apiFetch, ApiError } from "@/lib/api/client";
import { EMPTY_ASSEMBLIES, type Assembly, type AssembliesState } from "./types";
import type {
  AttachProofInput,
  CreateAssemblyInput,
  RecordDeliveryInput,
  ResendSummonsInput,
  SendSummonsInput,
} from "./types";

type ActionResult = { ok: true } | { ok: false; code: string };

interface AssembliesContextValue {
  isReady: boolean;
  assemblies: Assembly[];
  upsertAssembly: (assembly: Assembly) => Promise<ActionResult>;
  removeAssembly: (id: string) => Promise<ActionResult>;
  createAssembly: (input: CreateAssemblyInput) => Promise<ActionResult>;
  sendSummons: (input: SendSummonsInput) => Promise<ActionResult>;
  resendSummons: (input: ResendSummonsInput) => Promise<ActionResult>;
  attachProof: (input: AttachProofInput) => Promise<ActionResult>;
  recordDelivery: (input: RecordDeliveryInput) => Promise<ActionResult>;
  openSession: (id: string, call?: 1 | 2) => Promise<ActionResult>;
  closeSession: (id: string) => Promise<ActionResult>;
  refresh: () => void;
}

const AssembliesContext = createContext<AssembliesContextValue | undefined>(
  undefined,
);

export function AssembliesProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;

  const [state, setState] = useState<AssembliesState>(EMPTY_ASSEMBLIES);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_ASSEMBLIES);
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
        const data = await apiFetch<{ state: AssembliesState }>(
          "/api/assemblies",
        );
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_ASSEMBLIES);
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
      setState(EMPTY_ASSEMBLIES);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patch = useCallback(async (body: Record<string, unknown>) => {
    const data = await apiFetch<{ state: AssembliesState }>("/api/assemblies", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setState(data.state);
  }, []);

  const runAction = useCallback(
    async (body: Record<string, unknown>): Promise<ActionResult> => {
      try {
        await patch(body);
        return { ok: true };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false, code };
      }
    },
    [patch],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<AssembliesContextValue>(
    () => ({
      isReady,
      assemblies: state.assemblies,
      upsertAssembly: (assembly) =>
        runAction({ action: "upsert", assembly }),
      removeAssembly: (id) => runAction({ action: "remove", id }),
      createAssembly: (input) => runAction({ action: "create", ...input }),
      sendSummons: (input) => runAction({ action: "sendSummons", ...input }),
      resendSummons: (input) => runAction({ action: "resendSummons", ...input }),
      attachProof: (input) => runAction({ action: "attachProof", ...input }),
      recordDelivery: (input) =>
        runAction({ action: "recordDelivery", ...input }),
      openSession: (id, call) => runAction({ action: "openSession", id, call }),
      closeSession: (id) => runAction({ action: "close", id }),
      refresh,
    }),
    [isReady, state.assemblies, runAction, refresh],
  );

  return (
    <AssembliesContext.Provider value={value}>
      {children}
    </AssembliesContext.Provider>
  );
}

export function useAssemblies(): AssembliesContextValue {
  const ctx = useContext(AssembliesContext);
  if (!ctx) {
    throw new Error("useAssemblies must be used within AssembliesProvider");
  }
  return ctx;
}
