"use client";

import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { ReminderCopy } from "./types";

/** Localized mailto subject/body for payment reminders. */
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
    subjectMany: t("email.subjectMany"),
    bodyOne: (r) =>
      t("email.bodyOne", {
        name: r.ownerName,
        unit: r.unit,
        property: r.property,
        amount: money(r.amount),
        month: r.monthYear ?? "",
      }),
    bodyMany: (recipients) =>
      t("email.bodyMany", {
        count: recipients.length,
        list: recipients
          .map(
            (r) =>
              `• ${r.ownerName} — ${r.unit} / ${r.property} — ${money(r.amount)}`,
          )
          .join("\n"),
      }),
  };
}
