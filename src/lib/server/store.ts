import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import type { User, UserRole } from "@/app/types";
import type { Portfolio } from "@/lib/portfolio/types";
import type { CollectionsState } from "@/lib/collections/types";
import type { FinanceState } from "@/lib/finance/types";
import type { ComplianceState } from "@/lib/compliance/types";
import type { OccurrencesState } from "@/lib/occurrences/types";
import type { AssembliesState } from "@/lib/assemblies/types";
import type { OperationsState } from "@/lib/operations/types";
import type { WorksState } from "@/lib/works/types";
import type { AnnouncementsState } from "@/lib/announcements/types";
import type { CondoMembership } from "@/lib/memberships/types";
import type { OrgTeamMember } from "@/lib/team/types";
import type { LegalProcess } from "@/types";
import { DEFAULT_PASSWORD } from "@/lib/auth/constants";

export interface StoredAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  roleCode?: UserRole;
  avatar?: string | null;
  phone?: string | null;
}

export interface StoredSession {
  email: string;
  createdAt: number;
  rememberMe: boolean;
}

export interface StoredResetToken {
  email: string;
  expiresAt: number;
}

export interface StoreDocument {
  demoPassword: string;
  accounts: Record<string, StoredAccount>;
  sessions: Record<string, StoredSession>;
  resetTokens: Record<string, StoredResetToken>;
  portfolios: Record<string, Portfolio>;
  collections: Record<string, CollectionsState>;
  finance: Record<string, FinanceState>;
  compliance: Record<string, ComplianceState>;
  occurrences: Record<string, OccurrencesState>;
  assemblies: Record<string, AssembliesState>;
  operations: Record<string, OperationsState>;
  works: Record<string, WorksState>;
  announcements: Record<string, AnnouncementsState>;
  /** Per-host invite list: manager email → condo memberships. */
  membershipsByHost: Record<string, CondoMembership[]>;
  /** Organization staff invited by portfolio owner. */
  orgTeamsByHost: Record<string, OrgTeamMember[]>;
  /** Court / enforcement processes linked to debt certificates. */
  legalProcessesByHost: Record<string, LegalProcess[]>;
}

const EMPTY_STORE: StoreDocument = {
  demoPassword: DEFAULT_PASSWORD,
  accounts: {},
  sessions: {},
  resetTokens: {},
  portfolios: {},
  collections: {},
  finance: {},
  compliance: {},
  occurrences: {},
  assemblies: {},
  operations: {},
  works: {},
  announcements: {},
  membershipsByHost: {},
  orgTeamsByHost: {},
  legalProcessesByHost: {},
};

/** Process-local cache — avoids re-reading .data/store.json on every API call. */
let cache: StoreDocument | null = null;

function dataDir(): string {
  return path.join(process.cwd(), ".data");
}

function storePath(): string {
  return path.join(dataDir(), "store.json");
}

function ensureStoreFile(): void {
  const dir = dataDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(storePath())) {
    writeFileSync(storePath(), JSON.stringify(EMPTY_STORE), "utf8");
  }
}

function cloneEmpty(): StoreDocument {
  return {
    demoPassword: DEFAULT_PASSWORD,
    accounts: {},
    sessions: {},
    resetTokens: {},
    portfolios: {},
    collections: {},
    finance: {},
    compliance: {},
    occurrences: {},
    assemblies: {},
    operations: {},
    works: {},
    announcements: {},
    membershipsByHost: {},
    orgTeamsByHost: {},
    legalProcessesByHost: {},
  };
}

export function readStore(): StoreDocument {
  if (cache) return cache;
  ensureStoreFile();
  try {
    const raw = readFileSync(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreDocument>;
    cache = {
      demoPassword: parsed.demoPassword ?? DEFAULT_PASSWORD,
      accounts: parsed.accounts ?? {},
      sessions: parsed.sessions ?? {},
      resetTokens: parsed.resetTokens ?? {},
      portfolios: parsed.portfolios ?? {},
      collections: parsed.collections ?? {},
      finance: parsed.finance ?? {},
      compliance: parsed.compliance ?? {},
      occurrences: parsed.occurrences ?? {},
      assemblies: parsed.assemblies ?? {},
      operations: parsed.operations ?? {},
      works: parsed.works ?? {},
      announcements: parsed.announcements ?? {},
      membershipsByHost: parsed.membershipsByHost ?? {},
      orgTeamsByHost: parsed.orgTeamsByHost ?? {},
      legalProcessesByHost: parsed.legalProcessesByHost ?? {},
    };
    return cache;
  } catch {
    cache = cloneEmpty();
    writeFileSync(storePath(), JSON.stringify(cache), "utf8");
    return cache;
  }
}

export function writeStore(store: StoreDocument): void {
  ensureStoreFile();
  cache = store;
  // Compact JSON — demo store is rewritten often.
  writeFileSync(storePath(), JSON.stringify(store), "utf8");
}

export function updateStore(
  mutator: (store: StoreDocument) => void,
): StoreDocument {
  const store = readStore();
  mutator(store);
  writeStore(store);
  return store;
}

export function accountToUser(account: StoredAccount): User {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    roleCode: account.roleCode,
    avatar: account.avatar ?? null,
    phone: account.phone ?? null,
  };
}
