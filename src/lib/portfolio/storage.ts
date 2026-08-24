import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  EMPTY_PORTFOLIO,
  type OnboardingStep,
  type Portfolio,
} from "./types";
import {
  upsertOwnerInMemory,
  removeOwnerInMemory,
  upsertUnitInMemory,
  removeUnitInMemory,
} from "./mutations";

export {
  upsertCondominiumInMemory,
  removeCondominiumInMemory,
  upsertOwnerInMemory,
  removeOwnerInMemory,
  upsertUnitInMemory,
  removeUnitInMemory,
} from "./mutations";

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

export function removeOwner(email: string, ownerId: string): Portfolio {
  const current = readPortfolio(email);
  const next = removeOwnerInMemory(current, ownerId);
  writePortfolio(email, next);
  return next;
}

export function upsertUnit(email: string, unit: Unit): Portfolio {
  const current = readPortfolio(email);
  const next = upsertUnitInMemory(current, unit);
  writePortfolio(email, next);
  return next;
}

export function removeUnit(email: string, unitId: string): Portfolio {
  const current = readPortfolio(email);
  const next = removeUnitInMemory(current, unitId);
  writePortfolio(email, next);
  return next;
}
