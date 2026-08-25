import {
  mockAnnualBudgets,
  mockAssemblyMinutes,
  mockBankAccounts,
  mockCertificates,
  mockCondominiums,
  mockDomainOwners,
  mockExpenses,
  mockInsurancePolicies,
  mockOccurrences,
  mockQuotaPayments,
  mockSummons,
  mockUnits,
} from "@/fixtures/domain";
import type { Organization } from "@/app/[locale]/account/types";
import type { Portfolio } from "@/lib/portfolio/types";
import { emptyLedgerFields, normalizeLedger } from "@/lib/collections/ledger";
import type { CollectionsState } from "@/lib/collections/types";
import type { FinanceState } from "@/lib/finance/types";
import type { ComplianceState } from "@/lib/compliance/types";
import type { OccurrencesState } from "@/lib/occurrences/types";

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
  return normalizeLedger({
    quotas: mockQuotaPayments.map((q) => ({ ...q })),
    details: {},
    ...emptyLedgerFields(),
  });
}

export function buildDemoFinance(): FinanceState {
  return {
    budgets: mockAnnualBudgets.map((b) => ({
      ...b,
      valuesByCategory: { ...b.valuesByCategory },
    })),
    expenses: mockExpenses.map((e) => ({ ...e })),
    accounts: mockBankAccounts.map((a) => ({ ...a })),
  };
}

export function buildDemoCompliance(): ComplianceState {
  return {
    policies: mockInsurancePolicies.map((p) => ({ ...p })),
    certificates: mockCertificates.map((c) => ({ ...c })),
    assemblies: mockAssemblyMinutes.map((a) => ({ ...a })),
    summons: mockSummons.map((s) => ({ ...s })),
  };
}

export function buildDemoOccurrences(): OccurrencesState {
  return {
    occurrences: mockOccurrences.map((o) => ({
      ...o,
      photos: [...o.photos],
      comments: o.comments.map((c) => ({ ...c })),
      history: o.history.map((h) => ({ ...h })),
    })),
  };
}
