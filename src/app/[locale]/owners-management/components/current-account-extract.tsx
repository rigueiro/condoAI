"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatIsoDate, formatMonthYear } from "@/lib/collections/dates";
import {
  isChargeKind,
  type LedgerMovement,
} from "@/lib/collections";

type Props = {
  movements: LedgerMovement[];
  ownerName: string;
  unitLabel: string;
  condominiumName: string;
  onReceiptClick?: (receiptId: string) => void;
};

function movementLabel(
  movement: LedgerMovement,
  locale: string,
  t: ReturnType<typeof useTranslations<"currentAccount">>,
) {
  if (movement.source === "quota") {
    return t("source.quota", {
      period: formatMonthYear(movement.description, locale),
    });
  }
  if (movement.source === "receipt") {
    return t("source.receipt", {
      number: movement.receiptNumber ?? movement.description,
    });
  }
  if (
    movement.chargeKind &&
    isChargeKind(movement.chargeKind) &&
    movement.description === movement.chargeKind
  ) {
    return t(`kinds.${movement.chargeKind}`);
  }
  return movement.description;
}

function amountClass(amount: number) {
  return amount > 0 ? "text-error" : "text-success";
}

function CurrentAccountExtract({
  movements,
  ownerName,
  unitLabel,
  condominiumName,
  onReceiptClick,
}: Props) {
  const t = useTranslations("currentAccount");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();
  const closing = movements.at(-1)?.balance ?? 0;
  const asOf = formatIsoDate(
    movements.at(-1)?.date ?? new Date().toISOString(),
    locale,
  );

  return (
    <section className="bg-surface rounded-lg border border-border-light overflow-hidden print-extract">
      <div className="hidden print:block p-6 border-b border-border-light">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("printHeading")}
        </h1>
        <p className="text-text-secondary mt-1">{ownerName}</p>
        <p className="text-sm text-text-secondary">
          {unitLabel}
          {condominiumName ? ` · ${condominiumName}` : ""}
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {t("asOf", { date: asOf })}
        </p>
      </div>

      <div className="px-6 py-4 border-b border-border-light print:hidden">
        <h2 className="text-lg font-semibold text-text-primary">{t("title")}</h2>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      {movements.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-secondary">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("columns.date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("columns.description")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("columns.debit")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("columns.credit")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("columns.balance")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {movements.map((movement) => {
                const label = movementLabel(movement, locale, t);
                const receiptId =
                  movement.source === "receipt" ? movement.receiptId : undefined;
                return (
                  <tr key={movement.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-text-primary">
                      {formatIsoDate(movement.date, locale)}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-primary">
                      {receiptId && onReceiptClick ? (
                        <button
                          type="button"
                          onClick={() => onReceiptClick(receiptId)}
                          className="text-primary hover:underline font-medium"
                        >
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right tabular-nums text-text-primary">
                      {movement.side === "debit"
                        ? formatCurrency(movement.amount)
                        : "—"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right tabular-nums text-text-primary">
                      {movement.side === "credit"
                        ? formatCurrency(movement.amount)
                        : "—"}
                    </td>
                    <td
                      className={`px-6 py-3 whitespace-nowrap text-sm text-right tabular-nums font-medium ${amountClass(movement.balance)}`}
                    >
                      {formatCurrency(movement.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-secondary-50">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-sm font-semibold text-text-primary text-right"
                >
                  {t("columns.balance")}
                </td>
                <td
                  className={`px-6 py-3 text-sm text-right tabular-nums font-bold ${amountClass(closing)}`}
                >
                  {formatCurrency(closing)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

export default CurrentAccountExtract;
