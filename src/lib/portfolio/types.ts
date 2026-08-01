import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";

export type OnboardingStep = 1 | 2 | 3 | "complete";

export interface Portfolio {
  organization: Organization | null;
  condominiums: Condominium[];
  units: Unit[];
  owners: Owner[];
  onboardingStep: OnboardingStep;
}

export const EMPTY_PORTFOLIO: Portfolio = {
  organization: null,
  condominiums: [],
  units: [],
  owners: [],
  onboardingStep: 1,
};

export function isOnboardingComplete(portfolio: Portfolio | null): boolean {
  return portfolio?.onboardingStep === "complete";
}

export function needsOnboarding(portfolio: Portfolio | null): boolean {
  return !isOnboardingComplete(portfolio);
}
