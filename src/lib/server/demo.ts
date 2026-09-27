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
import type { AnnouncementsState } from "@/lib/announcements/types";
import type { OrgTeamMember } from "@/lib/team/types";
import { DEMO_EMAIL, DEFAULT_PASSWORD, isDemoEmail } from "@/lib/auth/constants";
import { hashPassword, isPasswordHash, toPasswordHash } from "./password";
import { seedDemoLegalProcesses, demoLegalSeedNeeded } from "./legal-processes";
import { readStore, updateStore, type StoreDocument, type StoredAccount } from "./store";

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

/** Manager login seeded on sign-in, including playground sessions. Same password as admin. */
export const PARTNER_MANAGER_EMAIL = "so.adm.condominios@gmail.com";
const PARTNER_MANAGER_NAME = "SO Administração de Condomínios";

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

export function buildDemoAnnouncements(): AnnouncementsState {
  return {
    announcements: [
      {
        id: "ann-1",
        condominiumId: "1",
        subject: "Elevator maintenance — 28 September",
        body: "The main elevator will be out of service on 28 September from 09:00 to 17:00 for annual inspection. Please use the service elevator.",
        audience: "all",
        createdAt: "2025-09-20T10:00:00.000Z",
        sentAt: "2025-09-20T10:00:00.000Z",
        createdBy: DEMO_EMAIL,
        recipientCount: 12,
      },
    ],
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

function portalDemoMemberships(
  now: string,
  hostEmail: string = DEMO_EMAIL,
): CondoMembership[] {
  return [
    {
      id: "mem-board-1",
      hostEmail,
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
      hostEmail,
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

function seedDemoTeam(store: StoreDocument, hostEmail: string): void {
  const key = hostEmail.trim().toLowerCase();
  const existing = store.orgTeamsByHost[key] ?? [];
  if (existing.length > 1) return;
  const now = new Date().toISOString();
  store.orgTeamsByHost[key] = [...existing, ...demoTeamMembers(now)];
}

function hashedDemoSecret(store: { demoPassword: string }): string {
  const current = store.demoPassword || DEFAULT_PASSWORD;
  if (isPasswordHash(current)) return current;
  const hashed = hashPassword(current);
  store.demoPassword = hashed;
  return hashed;
}

function upsertPortalDemoAccounts(
  store: { accounts: Record<string, StoredAccount>; demoPassword: string },
): void {
  const password = hashedDemoSecret(store);
  for (const account of portalDemoAccounts(password)) {
    const existing = store.accounts[account.email];
    if (!existing) {
      store.accounts[account.email] = account;
      continue;
    }
    if (!isPasswordHash(existing.password)) {
      store.accounts[account.email] = {
        ...existing,
        password: toPasswordHash(existing.password),
      };
    }
  }
}

function portalDemoNeedsWrite(store: {
  accounts: Record<string, StoredAccount>;
  demoPassword: string;
  membershipsByHost: Record<string, unknown[]>;
}): boolean {
  if (!isPasswordHash(store.demoPassword || DEFAULT_PASSWORD)) return true;
  if ((store.membershipsByHost[DEMO_EMAIL] ?? []).length === 0) return true;
  return [PORTAL_DEMO_BOARD_EMAIL, PORTAL_DEMO_OWNER_EMAIL].some((email) => {
    const existing = store.accounts[email];
    return !existing || !isPasswordHash(existing.password);
  });
}

function applyPortalDemoAccounts(store: StoreDocument): void {
  upsertPortalDemoAccounts(store);
  if ((store.membershipsByHost[DEMO_EMAIL] ?? []).length === 0) {
    store.membershipsByHost[DEMO_EMAIL] = portalDemoMemberships(
      new Date().toISOString(),
    );
  }
}

function writeFixtureWorkspace(store: StoreDocument, key: string): Portfolio {
  const portfolio = buildDemoPortfolio();
  store.portfolios[key] = portfolio;
  store.collections[key] = buildDemoCollections();
  store.finance[key] = buildDemoFinance();
  store.compliance[key] = buildDemoCompliance();
  store.occurrences[key] = buildDemoOccurrences();
  store.assemblies[key] = buildDemoAssemblies();
  store.operations[key] = buildDemoOperations();
  store.works[key] = buildDemoWorks();
  store.board[key] = buildDemoBoard();
  const announcements = buildDemoAnnouncements();
  for (const item of announcements.announcements) {
    item.createdBy = key;
  }
  store.announcements[key] = announcements;
  seedDemoTeam(store, key);
  seedDemoLegalProcesses(store, key);
  return portfolio;
}

function applyPartnerManager(store: StoreDocument): void {
  const key = PARTNER_MANAGER_EMAIL;
  const password = hashedDemoSecret(store);
  const existing = store.accounts[key];
  if (!existing) {
    store.accounts[key] = {
      id: "partner-so-adm",
      email: key,
      name: PARTNER_MANAGER_NAME,
      password,
      role: "Property Manager",
      roleCode: UserRole.PropertyManager,
      avatar: null,
      phone: null,
    };
  } else if (!isPasswordHash(existing.password)) {
    store.accounts[key] = {
      ...existing,
      password: toPasswordHash(existing.password),
    };
  }

  if (store.portfolios[key]?.condominiums?.length) return;

  writeFixtureWorkspace(store, key);
  if ((store.membershipsByHost[key] ?? []).length === 0) {
    store.membershipsByHost[key] = portalDemoMemberships(
      new Date().toISOString(),
      key,
    );
  }
}

/**
 * Seed the partner manager into this store when the login is missing.
 * Leaves an existing workspace untouched so local data is not reset.
 */
export function ensurePartnerManagerAccount(email: string): void {
  const key = email.trim().toLowerCase();
  if (key !== PARTNER_MANAGER_EMAIL) return;
  const store = readStore();
  const account = store.accounts[key];
  const accountReady = Boolean(account && isPasswordHash(account.password));
  const workspaceReady = (store.portfolios[key]?.condominiums?.length ?? 0) > 0;
  if (accountReady && workspaceReady) return;
  updateStore((next) => {
    applyPartnerManager(next);
  });
}

/** Seeds board/owner demo logins + memberships (idempotent). */
export function ensurePortalDemoAccounts(): void {
  if (!portalDemoNeedsWrite(readStore())) return;
  updateStore((store) => {
    applyPortalDemoAccounts(store);
  });
}

/**
 * Seed fixtures when this playground session has no manager workspace yet.
 */
export function ensurePlaygroundWorkspace(): void {
  const store = readStore();
  const existing = store.portfolios[DEMO_EMAIL];
  if (!existing?.condominiums?.length) {
    restoreDemoWorkspace();
    return;
  }
  if (
    !portalDemoNeedsWrite(store) &&
    !demoLegalSeedNeeded(store, DEMO_EMAIL)
  ) {
    return;
  }
  updateStore((next) => {
    if (portalDemoNeedsWrite(next)) {
      applyPortalDemoAccounts(next);
    }
    seedDemoLegalProcesses(next, DEMO_EMAIL);
  });
}

/** Demo login: seed portal extras, or restore the fixture workspace if it is missing. */
export function ensureDemoWorkspace(email: string): void {
  if (!isDemoEmail(email)) return;
  ensurePlaygroundWorkspace();
}

/**
 * Force-reload fixture workspace for the demo manager only.
 * Leaves other accounts untouched; re-ensures portal demo logins.
 */
export function restoreDemoWorkspace(): Portfolio {
  let portfolio: Portfolio | null = null;
  updateStore((store) => {
    portfolio = writeFixtureWorkspace(store, DEMO_EMAIL);
    applyPortalDemoAccounts(store);
  });
  if (!portfolio) throw new Error("demoWorkspaceMissing");
  return portfolio;
}
