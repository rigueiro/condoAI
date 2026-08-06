"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isDemoEmail, useUser } from "@/lib/auth";
import {
  mockCondominiums,
  mockDomainOwners,
  mockUnits,
} from "@/fixtures/domain";
import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  applyImport,
  completeOnboarding,
  readPortfolio,
  removeCondominium as removeCondominiumStored,
  removeCondominiumInMemory,
  removeOwner as removeOwnerStored,
  removeOwnerInMemory,
  saveFirstCondominium,
  saveOrganization,
  upsertCondominium as upsertCondominiumStored,
  upsertCondominiumInMemory,
  upsertOwner as upsertOwnerStored,
  upsertOwnerInMemory,
  writePortfolio,
} from "./storage";
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
  applyImport: (units: Unit[], owners: Owner[]) => void;
  completeOnboarding: () => void;
  updateOrganization: (organization: Organization) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(
  undefined,
);

const DEMO_PORTFOLIO: Portfolio = {
  organization: {
    name: "CondoAI Lda.",
    legalName: "CondoAI Sociedade Unipessoal Lda.",
    taxId: "PT509123456",
    email: "billing@condoai.pt",
    phone: "+351 21 000 0000",
    website: "https://condoai.pt",
    addressLine1: "Av. da Liberdade 100, 4º",
    city: "Lisboa",
    postalCode: "1250-145",
    country: "PT",
  },
  condominiums: mockCondominiums,
  units: mockUnits,
  owners: mockDomainOwners,
  onboardingStep: "complete",
};

function loadPortfolio(email: string | null): Portfolio {
  if (!email || isDemoEmail(email)) return DEMO_PORTFOLIO;
  return readPortfolio(email);
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const isDemo = !email || isDemoEmail(email);

  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY_PORTFOLIO);
  const [loadedEmail, setLoadedEmail] = useState<string | null>(null);

  // Sync stored portfolio when the signed-in email changes (render-time adjust).
  if (email !== loadedEmail) {
    setLoadedEmail(email);
    setPortfolio(loadPortfolio(email));
  }

  const refresh = useCallback(() => {
    setPortfolio(loadPortfolio(email));
  }, [email]);

  const withUserWrite = useCallback(
    (write: (userEmail: string) => Portfolio) => {
      if (!email || isDemoEmail(email)) return;
      setPortfolio(write(email));
    },
    [email],
  );

  const saveOrg = useCallback(
    (organization: Organization) => {
      withUserWrite((userEmail) => saveOrganization(userEmail, organization));
    },
    [withUserWrite],
  );

  const saveCondo = useCallback(
    (condominium: Condominium) => {
      withUserWrite((userEmail) =>
        saveFirstCondominium(userEmail, condominium),
      );
    },
    [withUserWrite],
  );

  const upsertCondo = useCallback(
    (condominium: Condominium) => {
      if (isDemo) {
        setPortfolio((prev) => upsertCondominiumInMemory(prev, condominium));
        return;
      }
      withUserWrite((userEmail) =>
        upsertCondominiumStored(userEmail, condominium),
      );
    },
    [isDemo, withUserWrite],
  );

  const removeCondo = useCallback(
    (condominiumId: string) => {
      if (isDemo) {
        setPortfolio((prev) =>
          removeCondominiumInMemory(prev, condominiumId),
        );
        return;
      }
      withUserWrite((userEmail) =>
        removeCondominiumStored(userEmail, condominiumId),
      );
    },
    [isDemo, withUserWrite],
  );

  const upsertOwnerFn = useCallback(
    (owner: Owner, unit?: Unit) => {
      if (isDemo) {
        setPortfolio((prev) => upsertOwnerInMemory(prev, owner, unit));
        return;
      }
      withUserWrite((userEmail) => upsertOwnerStored(userEmail, owner, unit));
    },
    [isDemo, withUserWrite],
  );

  const removeOwnerFn = useCallback(
    (ownerId: string) => {
      if (isDemo) {
        setPortfolio((prev) => removeOwnerInMemory(prev, ownerId));
        return;
      }
      withUserWrite((userEmail) => removeOwnerStored(userEmail, ownerId));
    },
    [isDemo, withUserWrite],
  );

  const doImport = useCallback(
    (units: Unit[], owners: Owner[]) => {
      withUserWrite((userEmail) => applyImport(userEmail, units, owners));
    },
    [withUserWrite],
  );

  const finishOnboarding = useCallback(() => {
    withUserWrite((userEmail) => completeOnboarding(userEmail));
  }, [withUserWrite]);

  const updateOrganization = useCallback(
    (organization: Organization) => {
      withUserWrite((userEmail) => {
        const next = { ...portfolio, organization };
        writePortfolio(userEmail, next);
        return next;
      });
    },
    [withUserWrite, portfolio],
  );

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      isDemo,
      isReady: true,
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
      applyImport: doImport,
      completeOnboarding: finishOnboarding,
      updateOrganization,
    }),
    [
      portfolio,
      isDemo,
      email,
      refresh,
      saveOrg,
      saveCondo,
      upsertCondo,
      removeCondo,
      upsertOwnerFn,
      removeOwnerFn,
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
