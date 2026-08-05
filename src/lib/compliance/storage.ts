import {
  mockAssemblyMinutes,
  mockCertificates,
  mockInsurancePolicies,
  mockSummons,
} from "@/fixtures/domain";
import type {
  AssemblyMinutes,
  Certificate,
  InsurancePolicy,
  Summons,
} from "@/types";
import { EMPTY_COMPLIANCE, type ComplianceState } from "./types";

const STORAGE_PREFIX = "condoai.compliance.";

const isBrowser = (): boolean => typeof window !== "undefined";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function cloneList<T>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

export function defaultCompliance(isDemo: boolean): ComplianceState {
  if (!isDemo) return { ...EMPTY_COMPLIANCE };
  return {
    policies: cloneList(mockInsurancePolicies),
    certificates: cloneList(mockCertificates),
    assemblies: cloneList(mockAssemblyMinutes),
    summons: cloneList(mockSummons),
  };
}

export function readCompliance(email: string): ComplianceState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ComplianceState;
    return {
      policies: Array.isArray(parsed.policies) ? parsed.policies : [],
      certificates: Array.isArray(parsed.certificates)
        ? parsed.certificates
        : [],
      assemblies: Array.isArray(parsed.assemblies) ? parsed.assemblies : [],
      summons: Array.isArray(parsed.summons) ? parsed.summons : [],
    };
  } catch {
    window.localStorage.removeItem(storageKey(email));
    return null;
  }
}

export function writeCompliance(email: string, state: ComplianceState): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(state));
}

export function loadCompliance(
  email: string,
  isDemo: boolean,
): ComplianceState {
  const stored = readCompliance(email);
  if (stored) return stored;

  const seeded = defaultCompliance(isDemo);
  writeCompliance(email, seeded);
  return seeded;
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((i) => i.id !== id);
}

function addOneYear(dateValue: Date | string, fallback: Date): string {
  const base = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
  const start = Number.isNaN(base.getTime()) ? fallback : base;
  const next = new Date(start);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export function upsertPolicy(
  state: ComplianceState,
  policy: InsurancePolicy,
): ComplianceState {
  return { ...state, policies: upsertById(state.policies, policy) };
}

export function removePolicy(
  state: ComplianceState,
  id: string,
): ComplianceState {
  return { ...state, policies: removeById(state.policies, id) };
}

export function upsertCertificate(
  state: ComplianceState,
  certificate: Certificate,
): ComplianceState {
  return {
    ...state,
    certificates: upsertById(state.certificates, certificate),
  };
}

export function removeCertificate(
  state: ComplianceState,
  id: string,
): ComplianceState {
  return { ...state, certificates: removeById(state.certificates, id) };
}

export function upsertAssembly(
  state: ComplianceState,
  assembly: AssemblyMinutes,
): ComplianceState {
  return { ...state, assemblies: upsertById(state.assemblies, assembly) };
}

export function removeAssembly(
  state: ComplianceState,
  id: string,
): ComplianceState {
  return { ...state, assemblies: removeById(state.assemblies, id) };
}

export function upsertSummons(
  state: ComplianceState,
  summons: Summons,
): ComplianceState {
  return { ...state, summons: upsertById(state.summons, summons) };
}

export function removeSummons(
  state: ComplianceState,
  id: string,
): ComplianceState {
  return { ...state, summons: removeById(state.summons, id) };
}

/** Roll insurance renewal forward by one year from the current renewal date. */
export function renewPolicy(
  state: ComplianceState,
  id: string,
  fromDate = new Date(),
): ComplianceState {
  return {
    ...state,
    policies: state.policies.map((p) =>
      p.id === id
        ? { ...p, renewalDate: addOneYear(p.renewalDate, fromDate) }
        : p,
    ),
  };
}

/** Extend certificate validity by one year from its current validity date. */
export function renewCertificate(
  state: ComplianceState,
  id: string,
  fromDate = new Date(),
): ComplianceState {
  return {
    ...state,
    certificates: state.certificates.map((c) =>
      c.id === id
        ? { ...c, validity: addOneYear(c.validity, fromDate) }
        : c,
    ),
  };
}
