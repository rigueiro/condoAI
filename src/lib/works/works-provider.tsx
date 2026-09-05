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
import { ApiError, apiFetch } from "@/lib/api/client";
import { useCollections } from "@/lib/collections";
import { useFinance } from "@/lib/finance";
import { EMPTY_WORKS, type WorksState } from "./types";
import type {
  AddInterventionInput,
  AddWorksQuoteInput,
  CreateWorksProjectInput,
  IssueWorksQuotaInput,
  LinkAssemblyInput,
  UpdateWorksProjectInput,
} from "./types";

type ActionResult = { ok: true } | { ok: false; code: string };

interface WorksContextValue {
  isReady: boolean;
  projects: WorksState["projects"];
  interventions: WorksState["interventions"];
  createProject: (input: CreateWorksProjectInput) => Promise<ActionResult>;
  updateProject: (input: UpdateWorksProjectInput) => Promise<ActionResult>;
  removeProject: (id: string) => Promise<ActionResult>;
  addQuote: (input: AddWorksQuoteInput) => Promise<ActionResult>;
  removeQuote: (projectId: string, quoteId: string) => Promise<ActionResult>;
  awardQuote: (projectId: string, quoteId: string) => Promise<ActionResult>;
  linkAssembly: (input: LinkAssemblyInput) => Promise<ActionResult>;
  unlinkAssembly: (projectId: string) => Promise<ActionResult>;
  issueExtraordinary: (input: IssueWorksQuotaInput) => Promise<ActionResult>;
  addIntervention: (input: AddInterventionInput) => Promise<ActionResult>;
  removeIntervention: (interventionId: string) => Promise<ActionResult>;
  completeProject: (id: string) => Promise<ActionResult>;
  cancelProject: (id: string) => Promise<ActionResult>;
  refresh: () => void;
}

const WorksContext = createContext<WorksContextValue | undefined>(undefined);

export function WorksProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { refresh: refreshFinance } = useFinance();
  const { refresh: refreshCollections } = useCollections();

  const [state, setState] = useState<WorksState>(EMPTY_WORKS);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_WORKS);
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
        const data = await apiFetch<{ state: WorksState }>("/api/works");
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_WORKS);
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
      setState(EMPTY_WORKS);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patch = useCallback(async (body: Record<string, unknown>) => {
    const data = await apiFetch<{ state: WorksState }>("/api/works", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setState(data.state);
  }, []);

  const runAction = useCallback(
    async (body: Record<string, unknown>): Promise<ActionResult> => {
      try {
        await patch(body);
        if (body.action === "issueExtraordinary") {
          refreshFinance();
          refreshCollections();
        }
        return { ok: true };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false, code };
      }
    },
    [patch, refreshCollections, refreshFinance],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<WorksContextValue>(
    () => ({
      isReady,
      projects: state.projects,
      interventions: state.interventions,
      createProject: (input) => runAction({ action: "create", ...input }),
      updateProject: (input) => runAction({ action: "update", ...input }),
      removeProject: (id) => runAction({ action: "remove", id }),
      addQuote: (input) => runAction({ action: "addQuote", ...input }),
      removeQuote: (projectId, quoteId) =>
        runAction({ action: "removeQuote", projectId, quoteId }),
      awardQuote: (projectId, quoteId) =>
        runAction({ action: "awardQuote", projectId, quoteId }),
      linkAssembly: (input) => runAction({ action: "linkAssembly", ...input }),
      unlinkAssembly: (projectId) =>
        runAction({ action: "unlinkAssembly", projectId }),
      issueExtraordinary: (input) =>
        runAction({ action: "issueExtraordinary", ...input }),
      addIntervention: (input) =>
        runAction({ action: "addIntervention", ...input }),
      removeIntervention: (interventionId) =>
        runAction({ action: "removeIntervention", interventionId }),
      completeProject: (id) => runAction({ action: "complete", id }),
      cancelProject: (id) => runAction({ action: "cancel", id }),
      refresh,
    }),
    [
      isReady,
      state.projects,
      state.interventions,
      runAction,
      refresh,
    ],
  );

  return (
    <WorksContext.Provider value={value}>{children}</WorksContext.Provider>
  );
}

export function useWorks(): WorksContextValue {
  const ctx = useContext(WorksContext);
  if (!ctx) {
    throw new Error("useWorks must be used within WorksProvider");
  }
  return ctx;
}
