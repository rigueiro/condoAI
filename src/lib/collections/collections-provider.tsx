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
import type { Owner as OwnerView } from "@/app/[locale]/owners-management/components/types";
import { monthYearFromDate } from "./dates";
import {
  openPaymentReminders,
  readRemindedIds,
  writeRemindedIds,
} from "./reminders";
import {
  appendPaidQuota,
  findOpenQuota,
  loadCollections,
  markQuotaPaid,
  writeCollections,
} from "./storage";
import {
  EMPTY_COLLECTIONS,
  type CollectionsState,
  type OverdueItem,
  type PaymentDetails,
  type ReminderCopy,
  type ReminderRecipient,
} from "./types";
import {
  applyOwnerBalances,
  quotasToOverdueItems,
  quotasToPaymentRows,
  type PaymentRow,
} from "./views";

export type RecordPaymentInput = {
  ownerName: string;
  property: string;
  unit: string;
  amount: number | string;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  /** Prefer matching a specific overdue/pending quota when known. */
  quotaId?: string;
};

interface CollectionsContextValue {
  isReady: boolean;
  payments: PaymentRow[];
  overdueItems: OverdueItem[];
  ownersWithBalances: OwnerView[];
  remindedIds: Set<string>;
  recordPayment: (input: RecordPaymentInput) => { quotaId: string } | null;
  sendReminders: (
    ids: string[],
    copy: ReminderCopy,
  ) => { sent: boolean; count: number; reason?: "no-email" };
  refresh: () => void;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(
  undefined,
);

function matchOwner(
  owners: OwnerView[],
  input: Pick<RecordPaymentInput, "ownerName" | "property" | "unit">,
): OwnerView | undefined {
  return owners.find(
    (o) =>
      o.name === input.ownerName &&
      o.property === input.property &&
      o.unit === input.unit,
  );
}

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const email = user?.email ?? null;
  const { isDemo, owners, portfolio } = usePortfolio();

  const [state, setState] = useState<CollectionsState>(EMPTY_COLLECTIONS);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(() => new Set());
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const domainOwners = portfolio.owners;
  const ownerIdsKey = domainOwners.map((o) => o.id).join(",");
  const loadKey = `${email ?? "anon"}:${isDemo ? "demo" : "live"}:${ownerIdsKey}`;

  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    if (email) {
      setState(loadCollections(email, isDemo, domainOwners));
      setRemindedIds(readRemindedIds(email));
    } else {
      setState(EMPTY_COLLECTIONS);
      setRemindedIds(new Set());
    }
  }

  const persist = useCallback(
    (next: CollectionsState) => {
      setState(next);
      if (email) writeCollections(email, next);
    },
    [email],
  );

  const refresh = useCallback(() => {
    if (!email) {
      setState(EMPTY_COLLECTIONS);
      return;
    }
    setState(loadCollections(email, isDemo, domainOwners));
    setRemindedIds(readRemindedIds(email));
  }, [email, isDemo, domainOwners]);

  const ownersWithBalances = useMemo(
    () => applyOwnerBalances(owners, state.quotas),
    [owners, state.quotas],
  );

  const payments = useMemo(
    () => quotasToPaymentRows(state.quotas, ownersWithBalances, state.details),
    [state.quotas, state.details, ownersWithBalances],
  );

  const overdueItems = useMemo(
    () => quotasToOverdueItems(state.quotas, ownersWithBalances),
    [state.quotas, ownersWithBalances],
  );

  const recordPayment = useCallback(
    (input: RecordPaymentInput): { quotaId: string } | null => {
      const amount =
        typeof input.amount === "string"
          ? parseFloat(input.amount)
          : input.amount;
      if (!Number.isFinite(amount) || amount <= 0) return null;

      const paidOn =
        input.paymentDate ?? new Date().toISOString().slice(0, 10);
      const owner = matchOwner(ownersWithBalances, input);
      const details: PaymentDetails = {
        paymentMethod: input.paymentMethod ?? "Bank Transfer",
        receiptNumber: `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        notes: input.notes,
        timestamp: new Date().toISOString(),
      };

      const existingId =
        input.quotaId && state.quotas.some((q) => q.id === input.quotaId)
          ? input.quotaId
          : owner
            ? findOpenQuota(state.quotas, owner.id, amount)?.id
            : undefined;

      if (existingId) {
        persist(markQuotaPaid(state, existingId, paidOn, details));
        return { quotaId: existingId };
      }

      if (!owner) return null;

      const newId = `pay-${crypto.randomUUID()}`;
      persist(
        appendPaidQuota(
          state,
          {
            id: newId,
            ownerId: owner.id,
            monthYear: monthYearFromDate(new Date(paidOn)),
            amount,
            status: "paid",
            paymentDate: paidOn,
          },
          details,
        ),
      );
      return { quotaId: newId };
    },
    [ownersWithBalances, state, persist],
  );

  const sendReminders = useCallback(
    (ids: string[], copy: ReminderCopy) => {
      if (!email) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }

      const idSet = new Set(ids);
      const ownerById = new Map(ownersWithBalances.map((o) => [o.id, o]));
      const recipients: ReminderRecipient[] = state.quotas
        .filter(
          (q) =>
            idSet.has(q.id) &&
            (q.status === "overdue" || q.status === "pending"),
        )
        .map((q) => {
          const owner = ownerById.get(q.ownerId);
          return {
            id: q.id,
            email: owner?.email ?? "",
            ownerName: owner?.name ?? "",
            unit: owner?.unit ?? "",
            property: owner?.property ?? "",
            amount: q.amount,
            monthYear: q.monthYear,
          };
        });

      const sent = openPaymentReminders(recipients, copy);
      if (!sent) {
        return { sent: false, count: 0, reason: "no-email" as const };
      }

      setRemindedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        writeRemindedIds(email, next);
        return next;
      });

      return {
        sent: true,
        count: recipients.filter((r) => r.email.trim()).length,
      };
    },
    [email, state.quotas, ownersWithBalances],
  );

  const value = useMemo<CollectionsContextValue>(
    () => ({
      isReady: Boolean(email),
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      recordPayment,
      sendReminders,
      refresh,
    }),
    [
      email,
      payments,
      overdueItems,
      ownersWithBalances,
      remindedIds,
      recordPayment,
      sendReminders,
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
