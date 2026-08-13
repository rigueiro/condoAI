import type {
  AssemblyMinutes,
  Certificate,
  InsurancePolicy,
  Summons,
} from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  removeAssembly,
  removeCertificate,
  removePolicy,
  removeSummons,
  renewCertificate,
  renewPolicy,
  upsertAssembly,
  upsertCertificate,
  upsertPolicy,
  upsertSummons,
} from "@/lib/compliance/storage";
import {
  EMPTY_COMPLIANCE,
  type ComplianceState,
} from "@/lib/compliance/types";
import { buildDemoCompliance } from "./demo";
import { readStore, writeStore } from "./store";

function normalizeCompliance(parsed: ComplianceState): ComplianceState {
  return {
    policies: Array.isArray(parsed.policies) ? parsed.policies : [],
    certificates: Array.isArray(parsed.certificates)
      ? parsed.certificates
      : [],
    assemblies: Array.isArray(parsed.assemblies) ? parsed.assemblies : [],
    summons: Array.isArray(parsed.summons) ? parsed.summons : [],
  };
}

function loadOrSeedCompliance(email: string): {
  key: string;
  state: ComplianceState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().compliance[key];
  if (existing) {
    return { key, state: normalizeCompliance(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoCompliance(), seeded: true };
  }
  return { key, state: { ...EMPTY_COMPLIANCE }, seeded: false };
}

/** Load compliance. Seeds demo fixtures when missing. */
export function getCompliance(email: string): ComplianceState {
  const { key, state, seeded } = loadOrSeedCompliance(email);
  if (seeded) {
    const store = readStore();
    store.compliance[key] = state;
    writeStore(store);
  }
  return state;
}

/** Single read→mutate→write, including first-touch demo seed. */
function mutateCompliance(
  email: string,
  mutator: (current: ComplianceState) => ComplianceState,
): ComplianceState {
  const { key, state } = loadOrSeedCompliance(email);
  const next = normalizeCompliance(mutator(state));
  const store = readStore();
  store.compliance[key] = next;
  writeStore(store);
  return next;
}

export function putPolicy(
  email: string,
  policy: InsurancePolicy,
): ComplianceState {
  return mutateCompliance(email, (current) => upsertPolicy(current, policy));
}

export function deletePolicy(email: string, id: string): ComplianceState {
  return mutateCompliance(email, (current) => removePolicy(current, id));
}

export function markPolicyRenewed(
  email: string,
  id: string,
): ComplianceState {
  return mutateCompliance(email, (current) => renewPolicy(current, id));
}

export function putCertificate(
  email: string,
  certificate: Certificate,
): ComplianceState {
  return mutateCompliance(email, (current) =>
    upsertCertificate(current, certificate),
  );
}

export function deleteCertificate(
  email: string,
  id: string,
): ComplianceState {
  return mutateCompliance(email, (current) =>
    removeCertificate(current, id),
  );
}

export function markCertificateRenewed(
  email: string,
  id: string,
): ComplianceState {
  return mutateCompliance(email, (current) => renewCertificate(current, id));
}

export function putAssembly(
  email: string,
  assembly: AssemblyMinutes,
): ComplianceState {
  return mutateCompliance(email, (current) =>
    upsertAssembly(current, assembly),
  );
}

export function deleteAssembly(email: string, id: string): ComplianceState {
  return mutateCompliance(email, (current) => removeAssembly(current, id));
}

export function putSummons(
  email: string,
  summons: Summons,
): ComplianceState {
  return mutateCompliance(email, (current) => upsertSummons(current, summons));
}

export function deleteSummons(email: string, id: string): ComplianceState {
  return mutateCompliance(email, (current) => removeSummons(current, id));
}
