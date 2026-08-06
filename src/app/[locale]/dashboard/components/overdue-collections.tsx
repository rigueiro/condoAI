"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import RecordPaymentModal, {
  type RecordPaymentInitialValues,
} from "@/app/[locale]/payment-tracking/components/record-payment-modal";
import {
  useCollections,
  useReminderCopy,
  type OverdueItem,
  type RecordPaymentInput,
} from "@/lib/collections";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export type { OverdueItem };

type FormatCurrency = (amount: number) => string;
type FlashTone = "success" | "warning";

function daysOverdue(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.round((startOfNow.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function OverdueCollections({
  formatCurrency: formatCurrencyProp,
}: {
  formatCurrency?: FormatCurrency;
}) {
  const t = useTranslations("dashboard.upcomingPayments");
  const { formatCurrency: formatCurrencyHook } = useFormatCurrency();
  const formatCurrency = formatCurrencyProp ?? formatCurrencyHook;
  const reminderCopy = useReminderCopy();

  const {
    overdueItems: items,
    remindedIds,
    recordPayment,
    sendReminders,
  } = useCollections();

  const [sendingIds, setSendingIds] = useState<Set<string>>(() => new Set());
  const [flash, setFlash] = useState<{ message: string; tone: FlashTone } | null>(
    null,
  );
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordInitial, setRecordInitial] =
    useState<RecordPaymentInitialValues | null>(null);
  const [recordQuotaId, setRecordQuotaId] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const pendingReminderIds = items
    .filter((item) => !remindedIds.has(item.id))
    .map((item) => item.id);
  const totalOutstanding = items.reduce((sum, item) => sum + item.amount, 0);
  const isSending = sendingIds.size > 0;

  const handleSendReminders = async (ids: string[]) => {
    if (ids.length === 0 || isSending) return;
    setSendingIds(new Set(ids));
    await new Promise((resolve) => setTimeout(resolve, 200));
    const result = sendReminders(ids, reminderCopy);
    setSendingIds(new Set());
    if (!result.sent) {
      setFlash({ message: t("reminderNoEmail"), tone: "warning" });
      return;
    }
    setFlash({
      message:
        result.count === 1
          ? t("reminderSentOne")
          : t("reminderSentMany", { count: result.count }),
      tone: "success",
    });
  };

  const openRecord = (item: OverdueItem) => {
    setRecordQuotaId(item.id);
    setRecordInitial({
      ownerId: item.ownerId,
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
    setRecordQuotaId(null);
  };

  const handleRecordSubmit = (data: RecordPaymentInput) => {
    const result = recordPayment({
      ...data,
      quotaId: recordQuotaId ?? undefined,
    });
    const ownerName =
      items.find((i) => i.ownerId === data.ownerId)?.ownerName ??
      data.ownerId;
    setFlash({
      message: result
        ? t("paymentRecorded", { name: ownerName })
        : t("paymentRecordedGeneric"),
      tone: "success",
    });
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

        {items.length > 0 && (
          <div className="mb-5 flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-warning font-medium">
              <Icon
                name="AlertTriangle"
                size={14}
                color="var(--color-warning)"
              />
              {t("summaryCount", { count: items.length })}
            </span>
            <span className="text-text-secondary">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        )}

        {flash && (
          <div
            className={`mb-4 p-3 rounded-lg border flex items-start gap-2 ${
              flash.tone === "warning"
                ? "bg-warning-50 border-warning-100"
                : "bg-success-50 border-success-100"
            }`}
          >
            <Icon
              name={
                flash.tone === "warning" ? "AlertTriangle" : "CheckCircle2"
              }
              size={16}
              color={
                flash.tone === "warning"
                  ? "var(--color-warning)"
                  : "var(--color-success)"
              }
              className="mt-0.5 shrink-0"
            />
            <p
              className={`text-sm ${
                flash.tone === "warning" ? "text-warning" : "text-success"
              }`}
            >
              {flash.message}
            </p>
          </div>
        )}

        {items.length === 0 ? (
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
            {items.map((item) => {
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
                        onClick={() => void handleSendReminders([item.id])}
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
              onClick={() => void handleSendReminders(pendingReminderIds)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-smooth text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending &&
              pendingReminderIds.every((id) => sendingIds.has(id)) ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Bell" size={16} />
              )}
              <span>
                {pendingReminderIds.length === 0 && items.length > 0
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
