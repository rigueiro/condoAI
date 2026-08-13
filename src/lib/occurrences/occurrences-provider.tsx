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
import { apiFetch } from "@/lib/api/client";
import type { Occurrence } from "@/types";
import { EMPTY_OCCURRENCES, type OccurrencesState } from "./types";

interface OccurrencesContextValue {
  isReady: boolean;
  occurrences: Occurrence[];
  upsertOccurrence: (occurrence: Occurrence) => void;
  removeOccurrences: (ids: string[]) => void;
  markOccurrencesResolved: (ids: string[]) => void;
  refresh: () => void;
}

const OccurrencesContext = createContext<OccurrencesContextValue | undefined>(
  undefined,
);

export function OccurrencesProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;

  const [state, setState] = useState<OccurrencesState>(EMPTY_OCCURRENCES);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_OCCURRENCES);
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
        const data = await apiFetch<{ state: OccurrencesState }>(
          "/api/occurrences",
        );
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_OCCURRENCES);
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
      setState(EMPTY_OCCURRENCES);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchOccurrences = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const data = await apiFetch<{ state: OccurrencesState }>(
          "/api/occurrences",
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
        );
        setState(data.state);
      } catch {
        /* keep current state */
      }
    },
    [],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<OccurrencesContextValue>(
    () => ({
      isReady,
      occurrences: state.occurrences,
      upsertOccurrence: (occurrence) => {
        void patchOccurrences({ action: "upsertOccurrence", occurrence });
      },
      removeOccurrences: (ids) => {
        void patchOccurrences({ action: "removeOccurrences", ids });
      },
      markOccurrencesResolved: (ids) => {
        void patchOccurrences({ action: "markResolved", ids });
      },
      refresh,
    }),
    [isReady, state.occurrences, patchOccurrences, refresh],
  );

  return (
    <OccurrencesContext.Provider value={value}>
      {children}
    </OccurrencesContext.Provider>
  );
}

export function useOccurrences(): OccurrencesContextValue {
  const ctx = useContext(OccurrencesContext);
  if (!ctx) {
    throw new Error("useOccurrences must be used within OccurrencesProvider");
  }
  return ctx;
}
