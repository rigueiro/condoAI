import {
  mockAnnualBudgets,
  mockBankAccounts,
  mockCertificates,
  mockCondominiums,
  mockDomainOwners,
  mockExpenses,
  mockInsurancePolicies,
  mockMaintenanceContracts,
  mockOccurrences,
  mockQuotaPayments,
  mockUnits,
  mockVendors,
  mockEquipment,
} from "@/fixtures/domain";
import type { Organization } from "@/app/[locale]/account/types";
import { UserRole } from "@/app/types";
import type { Portfolio } from "@/lib/portfolio/types";
import { emptyLedgerFields, normalizeLedger } from "@/lib/collections/ledger";
import type { CollectionsState } from "@/lib/collections/types";
import type { FinanceState } from "@/lib/finance/types";
import type { ComplianceState } from "@/lib/compliance/types";
import type { OccurrencesState } from "@/lib/occurrences/types";
import type { AssembliesState } from "@/lib/assemblies/types";
import type { OperationsState } from "@/lib/operations/types";
import type { WorksState } from "@/lib/works/types";
import { mockWorksState } from "@/fixtures/works";
import { mockBoardState } from "@/fixtures/board";
import type { BoardState } from "@/lib/board/types";
import type { CondoMembership } from "@/lib/memberships/types";
import { mockAssemblies } from "@/fixtures/assemblies";
import type { OrgTeamMember } from "@/lib/team/types";
import { DEMO_EMAIL, DEFAULT_PASSWORD } from "@/lib/auth/constants";
import { seedDemoLegalProcesses } from "./legal-processes";
import { listTeamMembers } from "./org-team";
import { updateStore, type StoredAccount } from "./store";

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

export const PORTAL_DEMO_BOARD_EMAIL = "board@condoai.pt";
export const PORTAL_DEMO_OWNER_EMAIL = "owner@condoai.pt";

export function buildDemoPortfolio(): Portfolio {
  return {
    organization: { ...DEMO_ORGANIZATION },
    condominiums: mockCondominiums.map((c) => ({ ...c })),
    units: mockUnits.map((u) => ({
      ...u,
      occupancies: u.occupancies.map((o) => ({ ...o })),
    })),
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
    extraordinaryQuotas: [],
  };
}

export function buildDemoCompliance(): ComplianceState {
  return {
    policies: mockInsurancePolicies.map((p) => ({ ...p })),
    certificates: mockCertificates.map((c) => ({ ...c })),
  };
}

export function buildDemoOperations(): OperationsState {
  return {
    vendors: mockVendors.map((v) => ({ ...v })),
    contracts: mockMaintenanceContracts.map((c) => ({ ...c })),
    equipment: mockEquipment.map((e) => ({ ...e })),
  };
}

export function buildDemoWorks(): WorksState {
  return structuredClone(mockWorksState());
}

export function buildDemoBoard(): BoardState {
  return structuredClone(mockBoardState());
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

export function buildDemoAssemblies(): AssembliesState {
  return {
    assemblies: mockAssemblies.map((assembly) => ({
      ...assembly,
      agenda: assembly.agenda.map((item) => ({ ...item })),
      summons: assembly.summons ? { ...assembly.summons } : null,
      attendance: assembly.attendance.map((row) => ({ ...row })),
      votes: assembly.votes.map((row) => ({
        ...row,
        ballots: { ...row.ballots },
      })),
      minutes: { ...assembly.minutes },
      resolutions: assembly.resolutions.map((row) => ({ ...row })),
    })),
  };
}

function portalDemoAccounts(password: string): StoredAccount[] {
  return [
    {
      id: "portal-board",
      email: PORTAL_DEMO_BOARD_EMAIL,
      name: "Carlos Mendes",
      password,
      role: "Board Member",
      roleCode: UserRole.BoardMember,
      avatar: null,
      phone: "+351 910 000 001",
    },
    {
      id: "portal-owner",
      email: PORTAL_DEMO_OWNER_EMAIL,
      name: "Ana Sofia Martins",
      password,
      role: "Resident",
      roleCode: UserRole.Resident,
      avatar: null,
      phone: "+351 912 345 678",
    },
  ];
}

function portalDemoMemberships(now: string): CondoMembership[] {
  return [
    {
      id: "mem-board-1",
      hostEmail: DEMO_EMAIL,
      memberEmail: PORTAL_DEMO_BOARD_EMAIL,
      condominiumId: "1",
      role: UserRole.BoardMember,
      ownerId: null,
      displayName: "Carlos Mendes",
      status: "active",
      invitedAt: now,
      activatedAt: now,
    },
    {
      id: "mem-owner-1",
      hostEmail: DEMO_EMAIL,
      memberEmail: PORTAL_DEMO_OWNER_EMAIL,
      condominiumId: "1",
      role: UserRole.Resident,
      ownerId: "1",
      displayName: "Ana Sofia Martins",
      status: "active",
      invitedAt: now,
      activatedAt: now,
    },
  ];
}

function demoTeamMembers(now: string): OrgTeamMember[] {
  return [
    {
      id: "team-admin",
      memberEmail: "sofia.almeida@condoai.pt",
      displayName: "Sofia Almeida",
      role: "admin",
      status: "active",
      invitedAt: now,
      activatedAt: now,
      lastActiveAt: "2026-05-19T08:42:00Z",
    },
    {
      id: "team-manager",
      memberEmail: "tiago.carvalho@condoai.pt",
      displayName: "Tiago Carvalho",
      role: "manager",
      status: "active",
      invitedAt: now,
      activatedAt: now,
      lastActiveAt: "2026-05-15T14:10:00Z",
    },
    {
      id: "team-staff",
      memberEmail: "marta.lopes@condoai.pt",
      displayName: "Marta Lopes",
      role: "staff",
      status: "invited",
      invitedAt: now,
    },
    {
      id: "team-viewer",
      memberEmail: "andre.pinto@condoai.pt",
      displayName: "André Pinto",
      role: "viewer",
      status: "inactive",
      invitedAt: now,
      activatedAt: now,
      lastActiveAt: "2026-02-02T11:00:00Z",
    },
  ];
}

function ensureDemoTeam(hostEmail: string): void {
  listTeamMembers(hostEmail);
  updateStore((store) => {
    const key = hostEmail.trim().toLowerCase();
    const existing = store.orgTeamsByHost[key] ?? [];
    if (existing.length > 1) return;
    const now = new Date().toISOString();
    store.orgTeamsByHost[key] = [
      ...existing,
      ...demoTeamMembers(now),
    ];
  });
}

/** Seeds board/owner demo logins + memberships (idempotent). */
export function ensurePortalDemoAccounts(): void {
  updateStore((store) => {
    const password = store.demoPassword || DEFAULT_PASSWORD;
    for (const account of portalDemoAccounts(password)) {
      store.accounts[account.email] ??= account;
    }
    if ((store.membershipsByHost[DEMO_EMAIL] ?? []).length === 0) {
      store.membershipsByHost[DEMO_EMAIL] = portalDemoMemberships(
        new Date().toISOString(),
      );
    }
  });
}

/**
 * Force-reload fixture workspace for the demo manager only.
 * Leaves other accounts untouched; re-ensures portal demo logins.
 */
export function restoreDemoWorkspace(): Portfolio {
  const portfolio = buildDemoPortfolio();
  updateStore((store) => {
    const key = DEMO_EMAIL;
    store.portfolios[key] = portfolio;
    store.collections[key] = buildDemoCollections();
    store.finance[key] = buildDemoFinance();
    store.compliance[key] = buildDemoCompliance();
    store.occurrences[key] = buildDemoOccurrences();
    store.assemblies[key] = buildDemoAssemblies();
    store.operations[key] = buildDemoOperations();
    store.works[key] = buildDemoWorks();
    store.board[key] = buildDemoBoard();

    const password = store.demoPassword || DEFAULT_PASSWORD;
    for (const account of portalDemoAccounts(password)) {
      store.accounts[account.email] ??= account;
    }
    if ((store.membershipsByHost[key] ?? []).length === 0) {
      store.membershipsByHost[key] = portalDemoMemberships(
        new Date().toISOString(),
      );
    }
    ensureDemoTeam(key);
    seedDemoLegalProcesses(key);
  });
  return portfolio;
}
