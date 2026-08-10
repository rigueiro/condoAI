"use client";

import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { ReminderCopy } from "./types";

/** Localized email/SMS copy for payment reminders, escalations, and digests. */
export function useReminderCopy(): ReminderCopy {
  const t = useTranslations("dashboard.upcomingPayments");
  const { formatCurrency } = useFormatCurrency();

  const money = (amount: number) =>
    formatCurrency(amount, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return {
    subjectOne: t("email.subjectOne"),
    bodyOne: (r) =>
      t("email.bodyOne", {
        name: r.ownerName,
        unit: r.unit,
        property: r.property,
        amount: money(r.amount),
        month: r.monthYear ?? "",
      }),
    smsReminder: (r) =>
      t("sms.reminder", {
        name: r.ownerName,
        unit: r.unit,
        property: r.property,
        amount: money(r.amount),
        month: r.monthYear ?? "",
      }),
    escalationSubject: t("email.escalationSubject"),
    escalationBody: (r) =>
      t("email.escalationBody", {
        name: r.ownerName,
        unit: r.unit,
        property: r.property,
        amount: money(r.amount),
        month: r.monthYear ?? "",
      }),
    smsEscalation: (r) =>
      t("sms.escalation", {
        name: r.ownerName,
        unit: r.unit,
        property: r.property,
        amount: money(r.amount),
        month: r.monthYear ?? "",
      }),
    digestSubject: (count) => t("digest.subject", { count }),
    digestBody: (recipients) =>
      t("digest.body", {
        count: recipients.length,
        list: recipients
          .map(
            (r) =>
              `• ${r.ownerName} — ${r.unit} / ${r.property} — ${money(r.amount)}${
                r.monthYear ? ` (${r.monthYear})` : ""
              }`,
          )
          .join("\n"),
      }),
  };
}
