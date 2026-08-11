import {
  mockCondominiums,
  mockDomainOwners,
  mockQuotaPayments,
  mockUnits,
} from "@/fixtures/domain";
import type { Organization } from "@/app/[locale]/account/types";
import type { Portfolio } from "@/lib/portfolio/types";
import type { CollectionsState } from "@/lib/collections/types";

export const DEMO_ORGANIZATION: Organization = {
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
};

export function buildDemoPortfolio(): Portfolio {
  return {
    organization: { ...DEMO_ORGANIZATION },
    condominiums: mockCondominiums.map((c) => ({ ...c })),
    units: mockUnits.map((u) => ({ ...u })),
    owners: mockDomainOwners.map((o) => ({
      ...o,
      contacts: { ...o.contacts },
      documents: [...o.documents],
    })),
    onboardingStep: "complete",
  };
}

export function buildDemoCollections(): CollectionsState {
  return {
    quotas: mockQuotaPayments.map((q) => ({ ...q })),
    details: {},
  };
}
