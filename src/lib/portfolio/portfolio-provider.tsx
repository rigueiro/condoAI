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
import { mockOwners, mockProperties } from "@/fixtures/views";
import type { Organization } from "@/app/[locale]/account/types";
import type { Property } from "@/app/[locale]/properties-management/types";
import type { Owner as OwnerView } from "@/app/[locale]/owners-management/components/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  applyImport,
  completeOnboarding,
  readPortfolio,
  saveFirstCondominium,
  saveOrganization,
  writePortfolio,
} from "./storage";
import {
  portfolioToOwnerViews,
  portfolioToPropertyViews,
} from "./mappers";
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
  properties: Property[];
  owners: OwnerView[];
  organization: Organization | null;
  refresh: () => void;
  saveOrganization: (organization: Organization) => void;
  saveFirstCondominium: (condominium: Condominium) => void;
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

  const properties = useMemo(() => {
    if (isDemo) return mockProperties;
    return portfolioToPropertyViews(portfolio);
  }, [isDemo, portfolio]);

  const owners = useMemo(() => {
    if (isDemo) return mockOwners;
    return portfolioToOwnerViews(portfolio);
  }, [isDemo, portfolio]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      isDemo,
      isReady: true,
      needsOnboarding: Boolean(email) && !isDemo && needsOnboarding(portfolio),
      isOnboardingComplete:
        !email || isDemo || isOnboardingComplete(portfolio),
      properties,
      owners,
      organization: portfolio.organization,
      refresh,
      saveOrganization: saveOrg,
      saveFirstCondominium: saveCondo,
      applyImport: doImport,
      completeOnboarding: finishOnboarding,
      updateOrganization,
    }),
    [
      portfolio,
      isDemo,
      email,
      properties,
      owners,
      refresh,
      saveOrg,
      saveCondo,
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
