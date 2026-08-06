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
  digestSentToday,
  onRenew,
  onSendDigest,
}: {
  items: AttentionItem[];
  digestSentToday: boolean;
  onRenew: (item: AttentionItem) => void;
  onSendDigest: () => void;
}) {
  const t = useTranslations("compliance");
  const canSendDigest = items.length > 0 && !digestSentToday;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-light bg-surface px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("digest.title")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t("digest.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {digestSentToday && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2 py-1 text-xs font-medium text-success">
                <Icon name="Check" size={14} />
                {t("digest.sentToday")}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              onClick={onSendDigest}
              disabled={!canSendDigest}
            >
              {digestSentToday ? t("digest.sent") : t("digest.send")}
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-surface px-5 py-8 text-center text-sm text-text-secondary">
          {t("attention.empty")}
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default AttentionPanel;
