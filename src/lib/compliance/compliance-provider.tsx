"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import type {
  AssemblyMinutes,
  Certificate,
  InsurancePolicy,
  Summons,
} from "@/types";
import {
  openDeadlineDigest,
  readDigestSentToday,
  writeDigestSentToday,
  type DigestCopy,
} from "./digests";
import {
  loadCompliance,
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
  writeCompliance,
} from "./storage";
import {
  EMPTY_COMPLIANCE,
  type AttentionItem,
  type ComplianceState,
} from "./types";
import { buildAttentionItems } from "./views";

interface ComplianceContextValue {
  isReady: boolean;
  policies: InsurancePolicy[];
  certificates: Certificate[];
  assemblies: AssemblyMinutes[];
  summons: Summons[];
  attentionItems: AttentionItem[];
  digestSentToday: boolean;
  upsertInsurance: (policy: InsurancePolicy) => void;
  removeInsurance: (id: string) => void;
  markInsuranceRenewed: (id: string) => void;
  upsertCert: (certificate: Certificate) => void;
  removeCert: (id: string) => void;
  markCertificateRenewed: (id: string) => void;
  upsertAssemblyMinutes: (assembly: AssemblyMinutes) => void;
  removeAssemblyMinutes: (id: string) => void;
  upsertSummonsDoc: (summons: Summons) => void;
  removeSummonsDoc: (id: string) => void;
  sendDeadlineDigest: (
    items: AttentionItem[],
    copy: DigestCopy,
  ) => { sent: boolean; count: number; reason?: "no-email" | "empty" };
  refresh: () => void;
}

const ComplianceContext = createContext<ComplianceContextValue | undefined>(
  undefined,
);

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { isDemo, portfolio } = usePortfolio();

  const [state, setState] = useState<ComplianceState>(EMPTY_COMPLIANCE);
  const [digestSentToday, setDigestSentToday] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const loadKey = `${email ?? "anon"}:${isDemo ? "demo" : "live"}`;

  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    if (email) {
      setState(loadCompliance(email, isDemo));
      setDigestSentToday(readDigestSentToday(email));
    } else {
      setState(EMPTY_COMPLIANCE);
      setDigestSentToday(false);
    }
  }

  const persist = useCallback(
    (updater: (prev: ComplianceState) => ComplianceState) => {
      setState((prev) => {
        const next = updater(prev);
        if (email) writeCompliance(email, next);
        return next;
      });
    },
    [email],
  );

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_COMPLIANCE);
      setDigestSentToday(false);
      return;
    }
    setState(loadCompliance(email, isDemo));
    setDigestSentToday(readDigestSentToday(email));
  }, [email, isDemo]);

  const attentionItems = useMemo(
    () => buildAttentionItems(state, portfolio.condominiums),
    [state.policies, state.certificates, portfolio.condominiums],
  );

  const sendDeadlineDigest = useCallback(
    (items: AttentionItem[], copy: DigestCopy) => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }
      if (items.length === 0) {
        return { sent: false, count: 0, reason: "empty" as const };
      }

      const sent = openDeadlineDigest(email, items, copy);
      if (!sent) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }

      writeDigestSentToday(email);
      setDigestSentToday(true);
      return { sent: true, count: items.length };
    },
    [email],
  );

  const upsertInsurance = useCallback(
    (policy: InsurancePolicy) => persist((prev) => upsertPolicy(prev, policy)),
    [persist],
  );
  const removeInsurance = useCallback(
    (id: string) => persist((prev) => removePolicy(prev, id)),
    [persist],
  );
  const markInsuranceRenewed = useCallback(
    (id: string) => persist((prev) => renewPolicy(prev, id)),
    [persist],
  );

  const upsertCert = useCallback(
    (certificate: Certificate) =>
      persist((prev) => upsertCertificate(prev, certificate)),
    [persist],
  );
  const removeCert = useCallback(
    (id: string) => persist((prev) => removeCertificate(prev, id)),
    [persist],
  );
  const markCertificateRenewed = useCallback(
    (id: string) => persist((prev) => renewCertificate(prev, id)),
    [persist],
  );

  const upsertAssemblyMinutes = useCallback(
    (assembly: AssemblyMinutes) =>
      persist((prev) => upsertAssembly(prev, assembly)),
    [persist],
  );
  const removeAssemblyMinutes = useCallback(
    (id: string) => persist((prev) => removeAssembly(prev, id)),
    [persist],
  );

  const upsertSummonsDoc = useCallback(
    (summons: Summons) => persist((prev) => upsertSummons(prev, summons)),
    [persist],
  );
  const removeSummonsDoc = useCallback(
    (id: string) => persist((prev) => removeSummons(prev, id)),
    [persist],
  );

  const value = useMemo<ComplianceContextValue>(
    () => ({
      isReady: Boolean(email),
      policies: state.policies,
      certificates: state.certificates,
      assemblies: state.assemblies,
      summons: state.summons,
      attentionItems,
      digestSentToday,
      upsertInsurance,
      removeInsurance,
      markInsuranceRenewed,
      upsertCert,
      removeCert,
      markCertificateRenewed,
      upsertAssemblyMinutes,
      removeAssemblyMinutes,
      upsertSummonsDoc,
      removeSummonsDoc,
      sendDeadlineDigest,
      refresh,
    }),
    [
      email,
      state.policies,
      state.certificates,
      state.assemblies,
      state.summons,
      attentionItems,
      digestSentToday,
      upsertInsurance,
      removeInsurance,
      markInsuranceRenewed,
      upsertCert,
      removeCert,
      markCertificateRenewed,
      upsertAssemblyMinutes,
      removeAssemblyMinutes,
      upsertSummonsDoc,
      removeSummonsDoc,
      sendDeadlineDigest,
      refresh,
    ],
  );

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance(): ComplianceContextValue {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    throw new Error("useCompliance must be used within ComplianceProvider");
  }
  return ctx;
}
