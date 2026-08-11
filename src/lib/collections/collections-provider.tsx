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
  type CollectionsState,
  type ContactAttempt,
  type OverdueItem,
  type ReminderCopy,
  type ReminderRecipient,
} from "./types";
import {
  applyOwnerBalances,
  quotasToOverdueItems,
  quotasToPaymentRows,
  type PaymentRow,
} from "./views";

export type { SendResult };

export type RecordPaymentInput = {
  ownerId: string;
  amount: number | string;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  /** Prefer matching a specific overdue/pending quota when known. */
  quotaId?: string;
};

interface CollectionsContextValue {
  isReady: boolean;
  quotas: QuotaPayment[];
  payments: PaymentRow[];
  overdueItems: OverdueItem[];
  ownersWithBalances: OwnerRow[];
  remindedIds: Set<string>;
  contactAttempts: ContactAttempt[];
  digestSentToday: boolean;
  recordPayment: (
    input: RecordPaymentInput,
  ) => Promise<{ quotaId: string } | null>;
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
  const { isDemo, portfolio, isReady: portfolioReady } = usePortfolio();

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
          data.state ?? {
            quotas: data.quotas,
            details: data.details ?? {},
          },
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
    () => applyOwnerBalances(portfolio, state.quotas, OWNER_AVATARS),
    [portfolio, state.quotas],
  );

  const payments = useMemo(
    () => quotasToPaymentRows(state.quotas, portfolio, state.details),
    [state.quotas, state.details, portfolio],
  );

  const overdueItems = useMemo(
    () => quotasToOverdueItems(state.quotas, portfolio),
    [state.quotas, portfolio],
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

  const recordPayment = useCallback(
    async (
      input: RecordPaymentInput,
    ): Promise<{ quotaId: string } | null> => {
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
        return { quotaId: data.quotaId };
      } catch {
        return null;
      }
    },
    [],
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
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      contactAttempts,
      digestSentToday,
      recordPayment,
      sendReminders,
      escalateOverdue,
      sendCollectionsDigest,
      refresh,
    }),
    [
      isReady,
      state.quotas,
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      contactAttempts,
      digestSentToday,
      recordPayment,
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
