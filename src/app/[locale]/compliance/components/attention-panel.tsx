"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type { AttentionItem } from "@/lib/compliance";

function urgencyLabel(
  item: AttentionItem,
  t: ReturnType<typeof useTranslations<"compliance">>,
): string {
  if (item.daysUntil < 0) {
    return t("attention.daysOverdue", { count: Math.abs(item.daysUntil) });
  }
  if (item.daysUntil === 0) return t("attention.dueToday");
  return t("attention.daysLeft", { count: item.daysUntil });
}

function AttentionPanel({
  items,
  onRenew,
}: {
  items: AttentionItem[];
  onRenew: (item: AttentionItem) => void;
}) {
  const t = useTranslations("compliance");

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border-light bg-surface px-5 py-8 text-center text-sm text-text-secondary">
        {t("attention.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-surface">
      <div className="border-b border-border-light px-5 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          {t("attention.title")}
        </h2>
      </div>
      <ul className="divide-y divide-border-light">
        {items.map((item) => {
          const title =
            item.kind === "insurance"
              ? t("attention.insuranceLabel", { insurer: item.title })
              : t("attention.certificateLabel", {
                  type: t(
                    `certificateTypes.${item.title as "energy" | "technical-inspection" | "usage-license"}`,
                  ),
                });

          return (
            <li
              key={`${item.kind}-${item.id}`}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      item.urgency === "overdue"
                        ? "bg-error-50 text-error"
                        : "bg-warning-50 text-warning"
                    }`}
                  >
                    {item.urgency === "overdue"
                      ? t("attention.overdue")
                      : t("attention.dueSoon")}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {title}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {item.condominiumName}
                  {item.kind === "insurance" && item.detail
                    ? ` · ${item.detail}`
                    : ""}
                  {" · "}
                  {urgencyLabel(item, t)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                onClick={() => onRenew(item)}
              >
                {t("attention.markRenewed")}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default AttentionPanel;
