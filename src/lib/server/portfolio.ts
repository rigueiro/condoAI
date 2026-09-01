import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  EMPTY_PORTFOLIO,
  type OnboardingStep,
  type Portfolio,
} from "@/lib/portfolio/types";
import { migratePortfolioOccupancy } from "@/lib/portfolio/occupancy";
import type { OccupancyLink } from "@/lib/portfolio/occupancy";
import {
  removeCondominiumInMemory,
  removeOwnerInMemory,
  removeUnitInMemory,
  upsertCondominiumInMemory,
  upsertOwnerInMemory,
  upsertUnitInMemory,
} from "@/lib/portfolio/mutations";
import { applySaleTransfer } from "@/lib/portfolio/transfer";
import { readStore, writeStore } from "./store";
import { restoreDemoWorkspace, ensurePortalDemoAccounts } from "./demo";

function normalizeCondominium(condo: Condominium): Condominium {
  return {
    ...condo,
    buildingType: condo.buildingType ?? "mid-rise",
    status: condo.status ?? "active",
    commonAreas: condo.commonAreas ?? [],
  };
}

function normalizePortfolio(parsed: Portfolio): Portfolio {
  return migratePortfolioOccupancy({
    organization: parsed.organization ?? null,
    condominiums: (parsed.condominiums ?? []).map(normalizeCondominium),
    units: parsed.units ?? [],
    owners: parsed.owners ?? [],
    onboardingStep: parsed.onboardingStep ?? 1,
  });
}

function loadPortfolio(email: string): { key: string; portfolio: Portfolio } {
  const key = email.trim().toLowerCase();
  const existing = readStore().portfolios[key];

  if (isDemoEmail(key)) {
    if (!existing?.condominiums?.length) {
      return { key, portfolio: restoreDemoWorkspace() };
    }
    ensurePortalDemoAccounts();
    return { key, portfolio: normalizePortfolio(existing) };
  }

  if (existing) {
    return { key, portfolio: normalizePortfolio(existing) };
  }
  return { key, portfolio: { ...EMPTY_PORTFOLIO } };
}

/** Load portfolio for email; restores demo fixtures when admin has no buildings. */
export function getPortfolio(email: string): Portfolio {
  return loadPortfolio(email).portfolio;
}

/** Single read→mutate→write for portfolio updates. */
function mutatePortfolio(
  email: string,
  mutator: (current: Portfolio) => Portfolio,
): Portfolio {
  const { key, portfolio } = loadPortfolio(email);
  const next = normalizePortfolio(mutator(portfolio));
  const store = readStore();
  store.portfolios[key] = next;
  writeStore(store);
  return next;
}

export function commitSaleTransfer(
  email: string,
  sellerId: string,
  buyer: Owner,
  unitIds: string[],
  saleDate: string,
): Portfolio {
  return mutatePortfolio(email, (current) =>
    applySaleTransfer(current, sellerId, buyer, unitIds, saleDate),
  );
}

export function saveOrganization(
  email: string,
  organization: Organization,
): Portfolio {
  return mutatePortfolio(email, (current) => ({
    ...current,
    organization,
    onboardingStep:
      current.onboardingStep === "complete" ? "complete" : 2,
  }));
}

export function saveFirstCondominium(
  email: string,
  condominium: Condominium,
): Portfolio {
  return mutatePortfolio(email, (current) => ({
    ...current,
    condominiums: [condominium],
    units: [],
    owners: [],
    onboardingStep:
      current.onboardingStep === "complete" ? "complete" : 3,
  }));
}

export function applyImport(
  email: string,
  units: Unit[],
  owners: Owner[],
): Portfolio {
  return mutatePortfolio(email, (current) => {
    const condo = current.condominiums[0];
    const condominiums =
      condo != null
        ? [
            {
              ...condo,
              numberOfUnits: Math.max(condo.numberOfUnits, units.length),
            },
          ]
        : current.condominiums;
    return { ...current, condominiums, units, owners };
  });
}

export function completeOnboarding(email: string): Portfolio {
  return mutatePortfolio(email, (current) => ({
    ...current,
    onboardingStep: "complete" as OnboardingStep,
  }));
}

export function updateOrganization(
  email: string,
  organization: Organization,
): Portfolio {
  return mutatePortfolio(email, (current) => ({ ...current, organization }));
}

export function upsertCondominium(
  email: string,
  condominium: Condominium,
): Portfolio {
  return mutatePortfolio(email, (current) =>
    upsertCondominiumInMemory(current, condominium),
  );
}

export function removeCondominium(
  email: string,
  condominiumId: string,
): Portfolio {
  return mutatePortfolio(email, (current) =>
    removeCondominiumInMemory(current, condominiumId),
  );
}

export function upsertOwner(
  email: string,
  owner: Owner,
  occupancies?: OccupancyLink[],
): Portfolio {
  return mutatePortfolio(email, (current) =>
    upsertOwnerInMemory(current, owner, occupancies),
  );
}

export function removeOwner(email: string, ownerId: string): Portfolio {
  return mutatePortfolio(email, (current) =>
    removeOwnerInMemory(current, ownerId),
  );
}

export function getCondominium(
  email: string,
  id: string,
): Condominium | null {
  return getPortfolio(email).condominiums.find((c) => c.id === id) ?? null;
}

export function getOwner(email: string, id: string): Owner | null {
  return getPortfolio(email).owners.find((o) => o.id === id) ?? null;
}

export function getUnit(email: string, id: string): Unit | null {
  return getPortfolio(email).units.find((u) => u.id === id) ?? null;
}

export function upsertUnit(email: string, unit: Unit): Portfolio {
  return mutatePortfolio(email, (current) => upsertUnitInMemory(current, unit));
}

export function removeUnit(email: string, unitId: string): Portfolio {
  return mutatePortfolio(email, (current) =>
    removeUnitInMemory(current, unitId),
  );
}
