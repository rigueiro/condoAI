"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { apiFetch } from "@/lib/api/client";
import type { Certificate, InsurancePolicy } from "@/types";
import {
  sendDeadlineDigestMessage,
  readDigestSentToday,
  writeDigestSentToday,
  type DigestCopy,
} from "./digests";
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
  attentionItems: AttentionItem[];
  digestSentToday: boolean;
  upsertInsurance: (policy: InsurancePolicy) => void;
  removeInsurance: (id: string) => void;
  markInsuranceRenewed: (id: string) => void;
  upsertCert: (certificate: Certificate) => void;
  removeCert: (id: string) => void;
  markCertificateRenewed: (id: string) => void;
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
  const { portfolio } = usePortfolio();

  const [state, setState] = useState<ComplianceState>(EMPTY_COMPLIANCE);
  const [digestSentToday, setDigestSentToday] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_COMPLIANCE);
    setDigestSentToday(false);
  }

  useEffect(() => {
    if (!email) return;
    const key = `${email}:${refreshNonce}`;
    if (loadedKey === key) return;
    if (inFlightRef.current === key) return;
    inFlightRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ state: ComplianceState }>(
          "/api/compliance",
        );
        if (cancelled) return;
        setState(data.state);
        setDigestSentToday(readDigestSentToday(email));
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_COMPLIANCE);
        setLoadedKey(key);
      } finally {
        if (inFlightRef.current === key) {
          inFlightRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, loadedKey, refreshNonce]);

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_COMPLIANCE);
      setDigestSentToday(false);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchCompliance = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const data = await apiFetch<{ state: ComplianceState }>(
          "/api/compliance",
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
        );
        setState(data.state);
      } catch {
        /* keep current state */
      }
    },
    [],
  );

  const sendDeadlineDigest = useCallback(
    (items: AttentionItem[], copy: DigestCopy) => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }
      if (items.length === 0) {
        return { sent: false, count: 0, reason: "empty" as const };
      }

      const sent = sendDeadlineDigestMessage(email, email, items, copy);
      if (!sent) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }

      writeDigestSentToday(email);
      setDigestSentToday(true);
      return { sent: true, count: items.length };
    },
    [email],
  );

  const attentionItems = useMemo(
    () => buildAttentionItems(state, portfolio.condominiums),
    [state, portfolio.condominiums],
  );

  const isReady = email === null || loadedKey === `${email}:${refreshNonce}`;

  const value = useMemo<ComplianceContextValue>(
    () => ({
      isReady,
      policies: state.policies,
      certificates: state.certificates,
      attentionItems,
      digestSentToday,
      upsertInsurance: (policy) => {
        void patchCompliance({ action: "upsertPolicy", policy });
      },
      removeInsurance: (id) => {
        void patchCompliance({ action: "removePolicy", id });
      },
      markInsuranceRenewed: (id) => {
        void patchCompliance({ action: "renewPolicy", id });
      },
      upsertCert: (certificate) => {
        void patchCompliance({ action: "upsertCertificate", certificate });
      },
      removeCert: (id) => {
        void patchCompliance({ action: "removeCertificate", id });
      },
      markCertificateRenewed: (id) => {
        void patchCompliance({ action: "renewCertificate", id });
      },
      sendDeadlineDigest,
      refresh,
    }),
    [
      isReady,
      state.policies,
      state.certificates,
      attentionItems,
      digestSentToday,
      patchCompliance,
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
