import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  EMPTY_PORTFOLIO,
  type OnboardingStep,
  type Portfolio,
} from "./types";

const STORAGE_PREFIX = "condoai.portfolio.";

const isBrowser = (): boolean => typeof window !== "undefined";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function normalizeCondominium(condo: Condominium): Condominium {
  return {
    ...condo,
    buildingType: condo.buildingType ?? "mid-rise",
    status: condo.status ?? "active",
    commonAreas: condo.commonAreas ?? [],
  };
}

export function readPortfolio(email: string): Portfolio {
  if (!isBrowser()) return { ...EMPTY_PORTFOLIO };
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return { ...EMPTY_PORTFOLIO };
    const parsed = JSON.parse(raw) as Portfolio;
    return {
      organization: parsed.organization ?? null,
      condominiums: (parsed.condominiums ?? []).map(normalizeCondominium),
      units: parsed.units ?? [],
      owners: parsed.owners ?? [],
      onboardingStep: parsed.onboardingStep ?? 1,
    };
  } catch {
    window.localStorage.removeItem(storageKey(email));
    return { ...EMPTY_PORTFOLIO };
  }
}

export function writePortfolio(email: string, portfolio: Portfolio): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(portfolio));
}

export function saveOrganization(
  email: string,
  organization: Organization,
): Portfolio {
  const current = readPortfolio(email);
  const next: Portfolio = {
    ...current,
    organization,
    onboardingStep:
      current.onboardingStep === "complete" ? "complete" : 2,
  };
  writePortfolio(email, next);
  return next;
}

export function saveFirstCondominium(
  email: string,
  condominium: Condominium,
): Portfolio {
  const current = readPortfolio(email);
  const next: Portfolio = {
    ...current,
    condominiums: [condominium],
    units: [],
    owners: [],
    onboardingStep:
      current.onboardingStep === "complete" ? "complete" : 3,
  };
  writePortfolio(email, next);
  return next;
}

export function applyImport(
  email: string,
  units: Unit[],
  owners: Owner[],
): Portfolio {
  const current = readPortfolio(email);
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

  const next: Portfolio = {
    ...current,
    condominiums,
    units,
    owners,
  };
  writePortfolio(email, next);
  return next;
}

export function completeOnboarding(email: string): Portfolio {
  const current = readPortfolio(email);
  const next: Portfolio = {
    ...current,
    onboardingStep: "complete" as OnboardingStep,
  };
  writePortfolio(email, next);
  return next;
}

export function setOnboardingStep(
  email: string,
  step: OnboardingStep,
): Portfolio {
  const current = readPortfolio(email);
  const next: Portfolio = { ...current, onboardingStep: step };
  writePortfolio(email, next);
  return next;
}

export function upsertCondominium(
  email: string,
  condominium: Condominium,
): Portfolio {
  const current = readPortfolio(email);
  const exists = current.condominiums.some((c) => c.id === condominium.id);
  const condominiums = exists
    ? current.condominiums.map((c) =>
        c.id === condominium.id ? condominium : c,
      )
    : [...current.condominiums, condominium];
  const next: Portfolio = { ...current, condominiums };
  writePortfolio(email, next);
  return next;
}

export function removeCondominium(
  email: string,
  condominiumId: string,
): Portfolio {
  const current = readPortfolio(email);
  const unitIds = new Set(
    current.units
      .filter((u) => u.condominiumId === condominiumId)
      .map((u) => u.id),
  );
  const next: Portfolio = {
    ...current,
    condominiums: current.condominiums.filter((c) => c.id !== condominiumId),
    units: current.units.filter((u) => u.condominiumId !== condominiumId),
    owners: current.owners.filter((o) => !unitIds.has(o.unitId)),
  };
  writePortfolio(email, next);
  return next;
}

/** Pure in-memory upsert (demo / unsaved portfolios). */
export function upsertCondominiumInMemory(
  portfolio: Portfolio,
  condominium: Condominium,
): Portfolio {
  const exists = portfolio.condominiums.some((c) => c.id === condominium.id);
  const condominiums = exists
    ? portfolio.condominiums.map((c) =>
        c.id === condominium.id ? condominium : c,
      )
    : [...portfolio.condominiums, condominium];
  return { ...portfolio, condominiums };
}

/** Pure in-memory remove with unit/owner cascade. */
export function removeCondominiumInMemory(
  portfolio: Portfolio,
  condominiumId: string,
): Portfolio {
  const unitIds = new Set(
    portfolio.units
      .filter((u) => u.condominiumId === condominiumId)
      .map((u) => u.id),
  );
  return {
    ...portfolio,
    condominiums: portfolio.condominiums.filter((c) => c.id !== condominiumId),
    units: portfolio.units.filter((u) => u.condominiumId !== condominiumId),
    owners: portfolio.owners.filter((o) => !unitIds.has(o.unitId)),
  };
}

/** Upsert owner and optionally its unit (create/update by id). */
export function upsertOwnerInMemory(
  portfolio: Portfolio,
  owner: Owner,
  unit?: Unit,
): Portfolio {
  let units = portfolio.units;
  if (unit) {
    const unitExists = units.some((u) => u.id === unit.id);
    units = unitExists
      ? units.map((u) => (u.id === unit.id ? unit : u))
      : [...units, unit];
  }

  const ownerExists = portfolio.owners.some((o) => o.id === owner.id);
  const owners = ownerExists
    ? portfolio.owners.map((o) => (o.id === owner.id ? owner : o))
    : [...portfolio.owners, owner];

  return { ...portfolio, units, owners };
}

export function upsertOwner(
  email: string,
  owner: Owner,
  unit?: Unit,
): Portfolio {
  const current = readPortfolio(email);
  const next = upsertOwnerInMemory(current, owner, unit);
  writePortfolio(email, next);
  return next;
}

/** Remove owner; leave the unit in place (may be reassigned later). */
export function removeOwnerInMemory(
  portfolio: Portfolio,
  ownerId: string,
): Portfolio {
  return {
    ...portfolio,
    owners: portfolio.owners.filter((o) => o.id !== ownerId),
  };
}

export function removeOwner(email: string, ownerId: string): Portfolio {
  const current = readPortfolio(email);
  const next = removeOwnerInMemory(current, ownerId);
  writePortfolio(email, next);
  return next;
}
