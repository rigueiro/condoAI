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
import { apiFetch, ApiError } from "@/lib/api/client";
import type { OwnerRow } from "@/app/[locale]/owners-management/components/types";
import type { QuotaPayment } from "@/types";
import { OWNER_AVATARS } from "@/fixtures/views";
import {
  daysOverdue,
  deliverCollectionsDigest,
  deliverPaymentEscalations,
  deliverPaymentReminders,
  isEscalationEligible,
  readCollectionsDigestSentToday,
  readContactAttempts,
  writeCollectionsDigestSentToday,
  writeContactAttempts,
  type SendResult,
} from "./reminders";
import {
  EMPTY_COLLECTIONS,
  type AccountCharge,
  type AccountReceipt,
  type AddChargeInput,
  type CollectionsState,
  type ContactAttempt,
  type CreateAgreementInput,
  type DebtCertificate,
  type IssueCertificateInput,
  type OverdueItem,
  type PayInstallmentInput,
  type PaymentAgreement,
  type RecordPaymentInput,
  type ReminderCopy,
  type ReminderRecipient,
} from "./types";
import type { IssueOrdinaryInput, IssueOrdinaryResult } from "./quota-run";
import type { TransferInput, TransferResult } from "@/lib/portfolio/transfer";
import {
  applyOwnerBalances,
  quotasToOverdueItems,
  quotasToPaymentRows,
  type PaymentRow,
} from "./views";
import {
  buildExtract,
  normalizeLedger,
  type CertificateView,
} from "./ledger";

export type { SendResult };
export type { AddChargeInput, IssueCertificateInput, RecordPaymentInput };

type AgreementMutationResult =
  | { ok: true; agreement: PaymentAgreement; receipt?: AccountReceipt }
  | { ok: false; code: string };

interface CollectionsContextValue {
  isReady: boolean;
  quotas: QuotaPayment[];
  charges: AccountCharge[];
  receipts: AccountReceipt[];
  certificates: DebtCertificate[];
  payments: PaymentRow[];
  overdueItems: OverdueItem[];
  ownersWithBalances: OwnerRow[];
  remindedIds: Set<string>;
  contactAttempts: ContactAttempt[];
  digestSentToday: boolean;
  extractForOwner: (ownerId: string, asOfDate?: string) => ReturnType<typeof buildExtract>;
  receiptForQuota: (quotaId: string) => AccountReceipt | undefined;
  recordPayment: (
    input: RecordPaymentInput,
  ) => Promise<{ quotaId: string; receipt?: AccountReceipt } | null>;
  addCharge: (input: AddChargeInput) => Promise<boolean>;
  issueOrdinaryMonth: (
    input: IssueOrdinaryInput,
  ) => Promise<
    | { ok: true; result: IssueOrdinaryResult }
    | { ok: false; code: string }
  >;
  issueCertificate: (
    input: IssueCertificateInput,
  ) => Promise<CertificateView | null>;
  transferOwnership: (
    input: TransferInput,
  ) => Promise<
    | { ok: true; result: TransferResult }
    | { ok: false; code: string }
  >;
  agreements: PaymentAgreement[];
  createPaymentAgreement: (
    input: CreateAgreementInput,
  ) => Promise<AgreementMutationResult>;
  payAgreementInstallment: (
    input: PayInstallmentInput,
  ) => Promise<AgreementMutationResult>;
  defaultPaymentAgreement: (
    agreementId: string,
  ) => Promise<AgreementMutationResult>;
  cancelPaymentAgreement: (
    agreementId: string,
  ) => Promise<AgreementMutationResult>;
  sendReminders: (ids: string[], copy: ReminderCopy) => SendResult;
  escalateOverdue: (ids: string[], copy: ReminderCopy) => SendResult;
  sendCollectionsDigest: (copy: ReminderCopy) => SendResult;
  refresh: () => void;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(
  undefined,
);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { isDemo, portfolio, isReady: portfolioReady, refresh: refreshPortfolio } =
    usePortfolio();

  const [state, setState] = useState<CollectionsState>(EMPTY_COLLECTIONS);
  const [contactAttempts, setContactAttempts] = useState<ContactAttempt[]>(
    () => [],
  );
  const [digestSentToday, setDigestSentToday] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlightRef = useRef<string | null>(null);

  const ownerIdsKey = portfolio.owners.map((o) => o.id).join(",");
  const desiredKey =
    email && portfolioReady
      ? `${email}:${isDemo ? "demo" : "live"}:${ownerIdsKey}:${refreshNonce}`
      : null;

  if (desiredKey === null && loadedKey !== null) {
    setLoadedKey(null);
    setState(EMPTY_COLLECTIONS);
    setContactAttempts([]);
    setDigestSentToday(false);
  }

  useEffect(() => {
    if (!desiredKey || !email) return;
    if (loadedKey === desiredKey) return;
    if (inFlightRef.current === desiredKey) return;
    inFlightRef.current = desiredKey;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{
          state?: CollectionsState;
          quotas: QuotaPayment[];
          details: CollectionsState["details"];
        }>("/api/quotas");
        if (cancelled) return;
        setState(
          normalizeLedger(
            data.state ?? {
              ...EMPTY_COLLECTIONS,
              quotas: data.quotas,
              details: data.details ?? {},
            },
          ),
        );
        setContactAttempts(readContactAttempts(email));
        setDigestSentToday(readCollectionsDigestSentToday(email));
        setLoadedKey(desiredKey);
      } catch {
        if (cancelled) return;
        setState(EMPTY_COLLECTIONS);
        setLoadedKey(desiredKey);
      } finally {
        if (inFlightRef.current === desiredKey) {
          inFlightRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [desiredKey, email, loadedKey]);

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_COLLECTIONS);
      setContactAttempts([]);
      setDigestSentToday(false);
      return;
    }
    setRefreshNonce((n) => n + 1);
  }, [email]);

  const ownersWithBalances = useMemo(
    () =>
      applyOwnerBalances(
        portfolio,
        state.quotas,
        OWNER_AVATARS,
        state.charges,
        state.receipts,
        state.agreements,
      ),
    [portfolio, state.quotas, state.charges, state.receipts, state.agreements],
  );

  const payments = useMemo(
    () => quotasToPaymentRows(state.quotas, portfolio, state.details),
    [state.quotas, state.details, portfolio],
  );

  const overdueItems = useMemo(
    () => quotasToOverdueItems(state.quotas, portfolio, state.agreements),
    [state.quotas, portfolio, state.agreements],
  );

  const remindedIds = useMemo(
    () => new Set(contactAttempts.map((c) => c.quotaId)),
    [contactAttempts],
  );

  const attemptByQuotaId = useMemo(() => {
    const map = new Map<string, ContactAttempt>();
    for (const attempt of contactAttempts) {
      map.set(attempt.quotaId, attempt);
    }
    return map;
  }, [contactAttempts]);

  const buildRecipients = useCallback(
    (ids: string[]): ReminderRecipient[] => {
      const idSet = new Set(ids);
      const ownerById = new Map(portfolio.owners.map((o) => [o.id, o]));
      const rowByOwnerId = new Map(
        ownersWithBalances.map((o) => [o.owner.id, o]),
      );
      const overdueById = new Map(overdueItems.map((item) => [item.id, item]));

      return state.quotas
        .filter(
          (q) =>
            idSet.has(q.id) &&
            (q.status === "overdue" || q.status === "pending"),
        )
        .map((q) => {
          const owner = ownerById.get(q.ownerId);
          const row = rowByOwnerId.get(q.ownerId);
          const overdue = overdueById.get(q.id);
          const dueDate = overdue?.dueDate ?? `${q.monthYear}-08`;
          return {
            id: q.id,
            email:
              owner?.contacts?.email?.trim() ||
              overdue?.email?.trim() ||
              "",
            phone:
              owner?.contacts?.phone?.trim() ||
              overdue?.phone?.trim() ||
              "",
            ownerName:
              owner?.fullName || overdue?.ownerName || row?.owner.fullName || "",
            unit: row?.unitLabel || overdue?.unit || "",
            property: row?.condominiumName || overdue?.property || "",
            amount: q.amount,
            monthYear: q.monthYear,
            dueDate,
          };
        });
    },
    [portfolio.owners, ownersWithBalances, overdueItems, state.quotas],
  );

  const mergeAttempts = useCallback(
    (nextAttempts: ContactAttempt[]) => {
      if (!email || nextAttempts.length === 0) return;
      setContactAttempts((prev) => {
        const byId = new Map(prev.map((c) => [c.quotaId, c]));
        for (const attempt of nextAttempts) {
          byId.set(attempt.quotaId, attempt);
        }
        const merged = [...byId.values()];
        writeContactAttempts(email, merged);
        return merged;
      });
    },
    [email],
  );

  const extractForOwner = useCallback(
    (ownerId: string, asOfDate?: string) =>
      buildExtract(ownerId, state.quotas, state.charges, state.receipts, asOfDate),
    [state.quotas, state.charges, state.receipts],
  );

  const receiptsByQuotaId = useMemo(() => {
    const map = new Map<string, AccountReceipt>();
    for (const receipt of state.receipts) {
      if (receipt.quotaId) map.set(receipt.quotaId, receipt);
    }
    return map;
  }, [state.receipts]);

  const receiptForQuota = useCallback(
    (quotaId: string) => receiptsByQuotaId.get(quotaId),
    [receiptsByQuotaId],
  );

  const recordPayment = useCallback(
    async (
      input: RecordPaymentInput,
    ): Promise<{ quotaId: string; receipt?: AccountReceipt } | null> => {
      const amount =
        typeof input.amount === "string"
          ? parseFloat(input.amount)
          : input.amount;
      if (!Number.isFinite(amount) || amount <= 0) return null;
      if (!input.ownerId) return null;

      try {
        const data = await apiFetch<{
          quotaId: string;
          state: CollectionsState;
        }>("/api/quotas/record-payment", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setState(data.state);
        const receipt = data.state.receipts.find(
          (item) => item.quotaId === data.quotaId,
        );
        return { quotaId: data.quotaId, receipt };
      } catch {
        return null;
      }
    },
    [],
  );

  const addCharge = useCallback(async (input: AddChargeInput) => {
    try {
      const data = await apiFetch<{ state: CollectionsState }>(
        "/api/ledger/charges",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
      setState(data.state);
      return true;
    } catch {
      return false;
    }
  }, []);

  const issueOrdinaryMonth = useCallback(
    async (input: IssueOrdinaryInput) => {
      try {
        const data = await apiFetch<{
          state: CollectionsState;
          result: IssueOrdinaryResult;
        }>("/api/quotas", {
          method: "PATCH",
          body: JSON.stringify({ action: "issueOrdinary", ...input }),
        });
        setState(data.state);
        return { ok: true as const, result: data.result };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false as const, code };
      }
    },
    [],
  );

  const issueCertificate = useCallback(
    async (input: IssueCertificateInput): Promise<CertificateView | null> => {
      try {
        const data = await apiFetch<{
          state: CollectionsState;
          view: CertificateView;
        }>("/api/ledger/certificates", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setState(data.state);
        return data.view;
      } catch {
        return null;
      }
    },
    [],
  );

  const transferOwnership = useCallback(
    async (input: TransferInput) => {
      try {
        const data = await apiFetch<{
          state: CollectionsState;
          result: TransferResult;
        }>("/api/owners/transfer", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setState(data.state);
        refreshPortfolio();
        return { ok: true as const, result: data.result };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false as const, code };
      }
    },
    [refreshPortfolio],
  );

  const requestAgreement = useCallback(
    async (init: RequestInit): Promise<AgreementMutationResult> => {
      try {
        const data = await apiFetch<{
          state: CollectionsState;
          agreement: PaymentAgreement;
          receipt?: AccountReceipt;
        }>("/api/ledger/agreements", init);
        setState(data.state);
        return {
          ok: true as const,
          agreement: data.agreement,
          receipt: data.receipt,
        };
      } catch (err) {
        const code = err instanceof ApiError ? err.message : "requestFailed";
        return { ok: false as const, code };
      }
    },
    [],
  );

  const createPaymentAgreement = useCallback(
    (input: CreateAgreementInput) =>
      requestAgreement({ method: "POST", body: JSON.stringify(input) }),
    [requestAgreement],
  );

  const payAgreementInstallment = useCallback(
    (input: PayInstallmentInput) =>
      requestAgreement({
        method: "PATCH",
        body: JSON.stringify({ action: "payInstallment", ...input }),
      }),
    [requestAgreement],
  );

  const defaultPaymentAgreement = useCallback(
    (agreementId: string) =>
      requestAgreement({
        method: "PATCH",
        body: JSON.stringify({ action: "default", agreementId }),
      }),
    [requestAgreement],
  );

  const cancelPaymentAgreement = useCallback(
    (agreementId: string) =>
      requestAgreement({
        method: "PATCH",
        body: JSON.stringify({ action: "cancel", agreementId }),
      }),
    [requestAgreement],
  );

  const sendReminders = useCallback(
    (ids: string[], copy: ReminderCopy): SendResult => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" };
      }

      const candidates = buildRecipients(ids);
      if (candidates.length === 0) {
        return { sent: false, count: 0, reason: "empty" };
      }

      const recipients = candidates.filter((r) => !attemptByQuotaId.has(r.id));
      if (recipients.length === 0) {
        return { sent: false, count: 0, reason: "already-contacted" };
      }

      const { result, attempts } = deliverPaymentReminders(
        email,
        recipients,
        copy,
      );
      if (result.sent) mergeAttempts(attempts);
      return result;
    },
    [email, buildRecipients, attemptByQuotaId, mergeAttempts],
  );

  const escalateOverdue = useCallback(
    (ids: string[], copy: ReminderCopy): SendResult => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" };
      }

      const recipients = buildRecipients(ids).filter((r) =>
        isEscalationEligible(
          attemptByQuotaId.get(r.id),
          daysOverdue(r.dueDate ?? ""),
        ),
      );
      const { result, attempts } = deliverPaymentEscalations(
        email,
        recipients,
        copy,
      );
      if (result.sent) mergeAttempts(attempts);
      return result;
    },
    [email, buildRecipients, attemptByQuotaId, mergeAttempts],
  );

  const sendCollectionsDigest = useCallback(
    (copy: ReminderCopy): SendResult => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" };
      }
      if (overdueItems.length === 0) {
        return { sent: false, count: 0, reason: "empty" };
      }

      const recipients = buildRecipients(overdueItems.map((i) => i.id));
      const result = deliverCollectionsDigest(email, email, recipients, {
        subject: copy.digestSubject,
        body: copy.digestBody,
      });
      if (result.sent) {
        writeCollectionsDigestSentToday(email);
        setDigestSentToday(true);
      }
      return result;
    },
    [email, overdueItems, buildRecipients],
  );

  const isReady = Boolean(email) && loadedKey === desiredKey;

  const value = useMemo<CollectionsContextValue>(
    () => ({
      isReady,
      quotas: state.quotas,
      charges: state.charges,
      receipts: state.receipts,
      certificates: state.certificates,
      agreements: state.agreements,
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      contactAttempts,
      digestSentToday,
      extractForOwner,
      receiptForQuota,
      recordPayment,
      addCharge,
      issueOrdinaryMonth,
      issueCertificate,
      transferOwnership,
      createPaymentAgreement,
      payAgreementInstallment,
      defaultPaymentAgreement,
      cancelPaymentAgreement,
      sendReminders,
      escalateOverdue,
      sendCollectionsDigest,
      refresh,
    }),
    [
      isReady,
      state.quotas,
      state.charges,
      state.receipts,
      state.certificates,
      state.agreements,
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      contactAttempts,
      digestSentToday,
      extractForOwner,
      receiptForQuota,
      recordPayment,
      addCharge,
      issueOrdinaryMonth,
      issueCertificate,
      transferOwnership,
      createPaymentAgreement,
      payAgreementInstallment,
      defaultPaymentAgreement,
      cancelPaymentAgreement,
      sendReminders,
      escalateOverdue,
      sendCollectionsDigest,
      refresh,
    ],
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const ctx = useContext(CollectionsContext);
  if (!ctx) {
    throw new Error("useCollections must be used within CollectionsProvider");
  }
  return ctx;
}
