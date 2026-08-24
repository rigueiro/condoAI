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
import { isDemoEmail, useUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  EMPTY_PORTFOLIO,
  isOnboardingComplete,
  needsOnboarding,
  type Portfolio,
} from "./types";

interface PortfolioContextValue {
  portfolio: Portfolio;
  isDemo: boolean;
  isReady: boolean;
  needsOnboarding: boolean;
  isOnboardingComplete: boolean;
  organization: Organization | null;
  refresh: () => void;
  saveOrganization: (organization: Organization) => void;
  saveFirstCondominium: (condominium: Condominium) => void;
  upsertCondominium: (condominium: Condominium) => void;
  removeCondominium: (condominiumId: string) => void;
  upsertOwner: (owner: Owner, unit?: Unit) => void;
  removeOwner: (ownerId: string) => void;
  upsertUnit: (unit: Unit) => Promise<void>;
  removeUnit: (unitId: string) => Promise<void>;
  applyImport: (units: Unit[], owners: Owner[]) => void;
  completeOnboarding: () => void;
  updateOrganization: (organization: Organization) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(
  undefined,
);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const isDemo = !email || isDemoEmail(email);

  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY_PORTFOLIO);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setPortfolio(EMPTY_PORTFOLIO);
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
        const data = await apiFetch<{ portfolio: Portfolio }>("/api/portfolio");
        if (cancelled) return;
        setPortfolio(data.portfolio);
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setPortfolio(EMPTY_PORTFOLIO);
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
      setPortfolio(EMPTY_PORTFOLIO);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchPortfolio = useCallback(
    async (body: Record<string, unknown>) => {
      const data = await apiFetch<{ portfolio: Portfolio }>("/api/portfolio", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setPortfolio(data.portfolio);
      return data.portfolio;
    },
    [],
  );

  const saveOrg = useCallback(
    (organization: Organization) => {
      void patchPortfolio({ action: "saveOrganization", organization });
    },
    [patchPortfolio],
  );

  const saveCondo = useCallback(
    (condominium: Condominium) => {
      void patchPortfolio({ action: "saveFirstCondominium", condominium });
    },
    [patchPortfolio],
  );

  const upsertCondo = useCallback((condominium: Condominium) => {
    void (async () => {
      const data = await apiFetch<{ portfolio: Portfolio }>(
        `/api/condominiums/${condominium.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ condominium }),
        },
      );
      setPortfolio(data.portfolio);
    })();
  }, []);

  const removeCondo = useCallback((condominiumId: string) => {
    void (async () => {
      const data = await apiFetch<{ portfolio: Portfolio }>(
        `/api/condominiums/${condominiumId}`,
        { method: "DELETE" },
      );
      setPortfolio(data.portfolio);
    })();
  }, []);

  const upsertOwnerFn = useCallback((owner: Owner, unit?: Unit) => {
    void (async () => {
      const data = await apiFetch<{ portfolio: Portfolio }>(
        `/api/owners/${owner.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ owner, unit }),
        },
      );
      setPortfolio(data.portfolio);
    })();
  }, []);

  const removeOwnerFn = useCallback((ownerId: string) => {
    void (async () => {
      const data = await apiFetch<{ portfolio: Portfolio }>(
        `/api/owners/${ownerId}`,
        { method: "DELETE" },
      );
      setPortfolio(data.portfolio);
    })();
  }, []);

  const upsertUnitFn = useCallback(async (unit: Unit) => {
    const data = await apiFetch<{ portfolio: Portfolio }>(
      `/api/units/${unit.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ unit }),
      },
    );
    setPortfolio(data.portfolio);
  }, []);

  const removeUnitFn = useCallback(async (unitId: string) => {
    const data = await apiFetch<{ portfolio: Portfolio }>(
      `/api/units/${unitId}`,
      { method: "DELETE" },
    );
    setPortfolio(data.portfolio);
  }, []);

  const doImport = useCallback(
    (units: Unit[], owners: Owner[]) => {
      void patchPortfolio({ action: "applyImport", units, owners });
    },
    [patchPortfolio],
  );

  const finishOnboarding = useCallback(() => {
    void patchPortfolio({ action: "completeOnboarding" });
  }, [patchPortfolio]);

  const updateOrganization = useCallback(
    (organization: Organization) => {
      void patchPortfolio({ action: "updateOrganization", organization });
    },
    [patchPortfolio],
  );

  const isReady =
    email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      isDemo,
      isReady,
      needsOnboarding: Boolean(email) && !isDemo && needsOnboarding(portfolio),
      isOnboardingComplete:
        !email || isDemo || isOnboardingComplete(portfolio),
      organization: portfolio.organization,
      refresh,
      saveOrganization: saveOrg,
      saveFirstCondominium: saveCondo,
      upsertCondominium: upsertCondo,
      removeCondominium: removeCondo,
      upsertOwner: upsertOwnerFn,
      removeOwner: removeOwnerFn,
      upsertUnit: upsertUnitFn,
      removeUnit: removeUnitFn,
      applyImport: doImport,
      completeOnboarding: finishOnboarding,
      updateOrganization,
    }),
    [
      portfolio,
      isDemo,
      isReady,
      email,
      refresh,
      saveOrg,
      saveCondo,
      upsertCondo,
      removeCondo,
      upsertOwnerFn,
      removeOwnerFn,
      upsertUnitFn,
      removeUnitFn,
      doImport,
      finishOnboarding,
      updateOrganization,
    ],
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("usePortfolio must be used within PortfolioProvider");
  }
  return ctx;
}
