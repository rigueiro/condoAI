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
import type { Certificate, InsurancePolicy, LegalProcess } from "@/types";
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
  legalProcesses: LegalProcess[];
  canManageLegal: boolean;
  openLegalProcess: (input: {
    ownerId: string;
    condominiumId?: string;
    certificateId?: string | null;
    description?: string;
  }) => Promise<LegalProcess>;
  updateLegalProcess: (
    id: string,
    patch: Partial<Pick<LegalProcess, "description" | "status" | "documents">>,
  ) => Promise<LegalProcess>;
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
  const [legalProcesses, setLegalProcesses] = useState<LegalProcess[]>([]);
  const [canManageLegal, setCanManageLegal] = useState(false);
  const [digestSentToday, setDigestSentToday] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  if (email === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_COMPLIANCE);
    setLegalProcesses([]);
    setCanManageLegal(false);
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
        const data = await apiFetch<{
          state: ComplianceState;
          legalProcesses?: LegalProcess[];
          canManageLegal?: boolean;
        }>("/api/compliance");
        if (cancelled) return;
        setState(data.state);
        setLegalProcesses(data.legalProcesses ?? []);
        setCanManageLegal(Boolean(data.canManageLegal));
        setDigestSentToday(readDigestSentToday(email));
        setLoadedKey(key);
      } catch {
        if (cancelled) return;
        setState(EMPTY_COMPLIANCE);
        setLegalProcesses([]);
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
      setLegalProcesses([]);
      setCanManageLegal(false);
      setDigestSentToday(false);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const patchCompliance = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const data = await apiFetch<{
          state?: ComplianceState;
          process?: LegalProcess;
        }>("/api/compliance", {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        if (data.state) setState(data.state);
        if (data.process) {
          setLegalProcesses((prev) => {
            const index = prev.findIndex((p) => p.id === data.process!.id);
            if (index < 0) return [...prev, data.process!];
            return prev.map((p) => (p.id === data.process!.id ? data.process! : p));
          });
        }
      } catch {
        /* keep current state */
      }
    },
    [],
  );

  const openLegalProcess = useCallback(
    async (input: {
      ownerId: string;
      condominiumId?: string;
      certificateId?: string | null;
      description?: string;
    }) => {
      const data = await apiFetch<{ process: LegalProcess }>("/api/compliance", {
        method: "PATCH",
        body: JSON.stringify({ action: "openLegalProcess", ...input }),
      });
      setLegalProcesses((prev) => [...prev, data.process]);
      return data.process;
    },
    [],
  );

  const updateLegalProcess = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<LegalProcess, "description" | "status" | "documents">
      >,
    ) => {
      const data = await apiFetch<{ process: LegalProcess }>("/api/compliance", {
        method: "PATCH",
        body: JSON.stringify({ action: "updateLegalProcess", id, ...patch }),
      });
      setLegalProcesses((prev) =>
        prev.map((process) =>
          process.id === id ? data.process : process,
        ),
      );
      return data.process;
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
      legalProcesses,
      canManageLegal,
      openLegalProcess,
      updateLegalProcess,
      refresh,
    }),
    [
      isReady,
      state.policies,
      state.certificates,
      attentionItems,
      digestSentToday,
      legalProcesses,
      canManageLegal,
      patchCompliance,
      openLegalProcess,
      updateLegalProcess,
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
