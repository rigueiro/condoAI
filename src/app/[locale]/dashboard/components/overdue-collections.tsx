"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import RecordPaymentModal, {
  type RecordPaymentInitialValues,
} from "@/app/[locale]/payment-tracking/components/record-payment-modal";
import type { PaymentView } from "@/fixtures/views";
import type { Owner } from "@/app/[locale]/owners-management/components/types";

export type OverdueItem = {
  id: string;
  ownerName: string;
  unit: string;
  property: string;
  amount: number;
  /** ISO date string for when the quota was due */
  dueDate: string;
  monthYear?: string;
};

type FormatCurrency = (amount: number) => string;

const REMINDERS_STORAGE_KEY = "condoai.collections.reminded";

type ReminderStore = {
  date: string;
  ids: string[];
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readRemindedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as ReminderStore;
    if (parsed.date !== todayKey()) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

function writeRemindedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    REMINDERS_STORAGE_KEY,
    JSON.stringify({ date: todayKey(), ids: [...ids] } satisfies ReminderStore),
  );
}

function daysOverdue(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.round((startOfNow.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/** Build overdue rows from demo payments or live owner balances. */
export function buildOverdueItems(
  isDemo: boolean,
  payments: PaymentView[],
  owners: Owner[],
): OverdueItem[] {
  if (isDemo) {
    return payments
      .filter((p) => p.quotaStatus === "overdue")
      .map((p) => ({
        id: String(p.id),
        ownerName: p.ownerName,
        unit: p.unit,
        property: p.property,
        amount: p.amount,
        dueDate: p.monthYear ? `${p.monthYear}-08` : p.date,
        monthYear: p.monthYear,
      }));
  }

  return owners
    .filter((o) => o.paymentStatus === "overdue" && o.currentBalance > 0)
    .map((o) => ({
      id: o.id,
      ownerName: o.name,
      unit: o.unit,
      property: o.property,
      amount: o.currentBalance,
      dueDate: o.lastPayment || todayKey(),
    }));
}

function OverdueCollections({
  items,
  formatCurrency,
}: {
  items: OverdueItem[];
  formatCurrency: FormatCurrency;
}) {
  const t = useTranslations("dashboard.upcomingPayments");
  const [remindedIds, setRemindedIds] = useState<Set<string>>(() => new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(() => new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordInitial, setRecordInitial] =
    useState<RecordPaymentInitialValues | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setRemindedIds(readRemindedIds());
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const openItems = items.filter((item) => !resolvedIds.has(item.id));
  const pendingReminderIds = openItems
    .filter((item) => !remindedIds.has(item.id))
    .map((item) => item.id);
  const totalOutstanding = openItems.reduce((sum, item) => sum + item.amount, 0);
  const isSending = sendingIds.size > 0;

  const sendReminders = async (ids: string[]) => {
    if (ids.length === 0 || isSending) return;
    setSendingIds(new Set(ids));
    await new Promise((resolve) => setTimeout(resolve, 700));
    setRemindedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      writeRemindedIds(next);
      return next;
    });
    setSendingIds(new Set());
    setFlash(
      ids.length === 1
        ? t("reminderSentOne")
        : t("reminderSentMany", { count: ids.length }),
    );
  };

  const openRecord = (item: OverdueItem) => {
    setRecordInitial({
      ownerName: item.ownerName,
      property: item.property,
      unit: item.unit,
      amount: item.amount,
      notes: item.monthYear
        ? t("recordNotes", { month: item.monthYear })
        : undefined,
    });
    setIsRecordOpen(true);
  };

  const closeRecord = () => {
    setIsRecordOpen(false);
    setRecordInitial(null);
  };

  const handleRecordSubmit = (data: {
    ownerName?: string;
    property?: string;
    unit?: string;
  }) => {
    const match = openItems.find(
      (item) =>
        item.ownerName === data.ownerName &&
        item.property === data.property &&
        item.unit === data.unit,
    );
    if (match) {
      setResolvedIds((prev) => new Set(prev).add(match.id));
      setFlash(t("paymentRecorded", { name: match.ownerName }));
    } else {
      setFlash(t("paymentRecordedGeneric"));
    }
    closeRecord();
  };

  return (
    <>
      <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
          </div>
          <Link
            href="/payment-tracking"
            className="text-primary hover:text-primary-700 text-sm font-medium transition-smooth shrink-0"
          >
            {t("viewAll")}
          </Link>
        </div>

        {openItems.length > 0 && (
          <div className="mb-5 flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-warning font-medium">
              <Icon
                name="AlertTriangle"
                size={14}
                color="var(--color-warning)"
              />
              {t("summaryCount", { count: openItems.length })}
            </span>
            <span className="text-text-secondary">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        )}

        {flash && (
          <div className="mb-4 p-3 rounded-lg bg-success-50 border border-success-100 flex items-start gap-2">
            <Icon
              name="CheckCircle2"
              size={16}
              color="var(--color-success)"
              className="mt-0.5 shrink-0"
            />
            <p className="text-sm text-success">{flash}</p>
          </div>
        )}

        {openItems.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-success-50 flex items-center justify-center">
              <Icon
                name="CheckCircle2"
                size={24}
                color="var(--color-success)"
              />
            </div>
            <p className="text-sm font-medium text-text-primary">
              {t("emptyTitle")}
            </p>
            <p className="text-xs text-text-secondary mt-1">{t("emptyBody")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openItems.map((item) => {
              const overdueDays = daysOverdue(item.dueDate);
              const reminded = remindedIds.has(item.id);
              const sending = sendingIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-border-light hover:border-primary-200 transition-smooth"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-text-primary truncate">
                        {item.ownerName}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {t("unitProperty", {
                          unit: item.unit,
                          property: item.property,
                        })}
                      </p>
                    </div>
                    <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border bg-error-50 text-error-700 border-error-200 shrink-0">
                      <Icon name="AlertTriangle" size={12} />
                      <span>{t("status.overdue")}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {overdueDays === 0
                          ? t("dueDate.today")
                          : t("dueDate.overdue", { days: overdueDays })}
                      </p>
                      {reminded && (
                        <p className="text-xs text-success mt-1 flex items-center gap-1">
                          <Icon
                            name="Bell"
                            size={12}
                            color="var(--color-success)"
                          />
                          {t("remindedToday")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={sending || reminded || isSending}
                        onClick={() => void sendReminders([item.id])}
                        className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="Bell" size={12} />
                        )}
                        <span>
                          {reminded
                            ? t("reminded")
                            : sending
                              ? t("sending")
                              : t("sendReminder")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecord(item)}
                        className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-secondary-100 text-text-primary rounded-lg hover:bg-secondary-200 transition-smooth text-xs font-medium"
                      >
                        <Icon name="Plus" size={12} />
                        <span>{t("record")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border-light">
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              disabled={isSending || pendingReminderIds.length === 0}
              onClick={() => void sendReminders(pendingReminderIds)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending && pendingReminderIds.every((id) => sendingIds.has(id)) ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Bell" size={16} />
              )}
              <span>
                {pendingReminderIds.length === 0 && openItems.length > 0
                  ? t("allReminded")
                  : t("sendReminders")}
              </span>
            </button>

            <Link
              href="/payment-tracking"
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-100 text-text-primary rounded-lg hover:bg-secondary-200 transition-smooth text-sm font-medium"
            >
              <Icon name="CreditCard" size={16} />
              <span>{t("managePayments")}</span>
            </Link>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isRecordOpen}
        onClose={closeRecord}
        onSubmit={handleRecordSubmit}
        initialValues={recordInitial}
      />
    </>
  );
}

export default OverdueCollections;
