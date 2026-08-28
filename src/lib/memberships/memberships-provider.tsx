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
import type { TeamRole } from "@/lib/team/types";
import type { PortalContext, PortalMembershipView } from "./types";

type MembershipsContextValue = {
  mode: "manager" | "portal";
  portalMemberships: PortalMembershipView[];
  teamRole: TeamRole | null;
  isReady: boolean;
};

const MembershipsContext = createContext<MembershipsContextValue | null>(null);

const EMPTY: MembershipsContextValue = {
  mode: "manager",
  portalMemberships: [],
  teamRole: null,
  isReady: true,
};

export function MembershipsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<MembershipsContextValue>({
    mode: "manager",
    portalMemberships: [],
    teamRole: null,
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
            teamRole: context.teamRole ?? null,
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
