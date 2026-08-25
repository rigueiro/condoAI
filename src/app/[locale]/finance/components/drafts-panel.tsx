"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { DraftBudgetItem } from "@/lib/finance";

function DraftsPanel({
  items,
  onApprove,
}: {
  items: DraftBudgetItem[];
  onApprove: (item: DraftBudgetItem) => void;
}) {
  const t = useTranslations("finance");
  const { formatCurrency } = useFormatCurrency();

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
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning">
                  {t("attention.draft")}
                </span>
                {item.reserveShortfall > 0 && (
                  <span className="inline-flex items-center rounded-md bg-error-50 px-2 py-0.5 text-xs font-medium text-error">
                    {t("attention.reserveShort")}
                  </span>
                )}
                <span className="text-sm font-medium text-text-primary">
                  {t("attention.yearLabel", { year: item.year })}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-text-secondary">
                {item.condominiumName}
                {" · "}
                {formatCurrency(item.total)}
                {" · "}
                {t("attention.categories", { count: item.categoryCount })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="Check"
              onClick={() => onApprove(item)}
            >
              {t("attention.approve")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DraftsPanel;
