"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type { PortalContext, PortalMembershipView } from "./types";

type MembershipsContextValue = {
  mode: "manager" | "portal";
  portalMemberships: PortalMembershipView[];
  isReady: boolean;
};

const MembershipsContext = createContext<MembershipsContextValue | null>(null);

const EMPTY: MembershipsContextValue = {
  mode: "manager",
  portalMemberships: [],
  isReady: true,
};

export function MembershipsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<MembershipsContextValue>({
    mode: "manager",
    portalMemberships: [],
    isReady: false,
  });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      if (!user) {
        if (!cancelled) setState(EMPTY);
        return;
      }
      try {
        const context = await apiFetch<PortalContext>("/api/portal/context");
        if (!cancelled) {
          setState({
            mode: context.mode,
            portalMemberships: context.memberships,
            isReady: true,
          });
        }
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return (
    <MembershipsContext.Provider value={state}>
      {children}
    </MembershipsContext.Provider>
  );
}

export function useMemberships(): MembershipsContextValue {
  return useContext(MembershipsContext) ?? EMPTY;
}
