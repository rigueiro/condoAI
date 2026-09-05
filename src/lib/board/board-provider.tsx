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
import { useMemberships } from "@/lib/memberships";
import { EMPTY_BOARD, type BoardState } from "./types";
import type { RecordMandateInput, UpdateMandateInput } from "./types";

type ActionResult = { ok: true } | { ok: false; code: string };

interface BoardContextValue {
  isReady: boolean;
  mandates: BoardState["mandates"];
  recordMandate: (input: RecordMandateInput) => Promise<ActionResult>;
  updateMandate: (input: UpdateMandateInput) => Promise<ActionResult>;
  removeMandate: (id: string) => Promise<ActionResult>;
  refresh: () => void;
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { mode, isReady: accessReady } = useMemberships();

  const [state, setState] = useState<BoardState>(EMPTY_BOARD);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_BOARD);
  }

  useEffect(() => {
    if (!email || !accessReady) return;
    const key = `${email}:${refreshNonce}`;
    if (loadedKey === key) return;

    // Portal-only accounts cannot call manager /api/board.
    if (mode === "portal") {
      setState(EMPTY_BOARD);
      setLoadedKey(key);
      return;
    }

    if (inFlightRef.current === key) return;
    inFlightRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ state: BoardState }>("/api/board");
        if (cancelled) return;
        setState(data.state);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_BOARD);
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
  }, [email, mode, accessReady, loadedKey, refreshNonce]);

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_BOARD);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patch = useCallback(async (body: Record<string, unknown>) => {
    const data = await apiFetch<{ state: BoardState }>("/api/board", {
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

  const isReady =
    email === null ||
    (accessReady && loadedKey === `${email}:${refreshNonce}`);

  const value = useMemo<BoardContextValue>(
    () => ({
      isReady,
      mandates: state.mandates,
      recordMandate: (input) => runAction({ action: "record", ...input }),
      updateMandate: (input) => runAction({ action: "update", ...input }),
      removeMandate: (id) => runAction({ action: "remove", id }),
      refresh,
    }),
    [isReady, state.mandates, runAction, refresh],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error("useBoard must be used within BoardProvider");
  }
  return ctx;
}
