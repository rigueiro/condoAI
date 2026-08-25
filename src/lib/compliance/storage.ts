import type { Certificate, InsurancePolicy } from "@/types";
import type { ComplianceState } from "./types";

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
