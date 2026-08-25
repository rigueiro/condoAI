"use client";

import { useLocale, useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { AccountReceipt } from "@/lib/collections";
import { formatIsoDate } from "@/lib/collections/dates";
import { usePrintDocument } from "./use-print-document";

type Props = {
  receipt: AccountReceipt | null;
  ownerName: string;
  property?: string;
  unit?: string;
  onClose: () => void;
};

const METHOD_KEYS: Record<string, "bankTransfer" | "creditCard" | "check" | "cash" | "online" | "onlinePayment"> = {
  "Bank Transfer": "bankTransfer",
  "Credit Card": "creditCard",
  Check: "check",
  Cash: "cash",
  Online: "online",
  "Online Payment": "onlinePayment",
};

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

function ReceiptModal({ receipt, ownerName, property, unit, onClose }: Props) {
  const t = useTranslations("currentAccount.receipt");
  const tMethods = useTranslations("paymentTracking.paymentMethods");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();
  const print = usePrintDocument(Boolean(receipt));

  if (!receipt) return null;

  const methodKey = METHOD_KEYS[receipt.paymentMethod];
  const methodLabel = methodKey ? tMethods(methodKey) : receipt.paymentMethod;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4 print:static print:bg-transparent print:p-0 print-document">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-lg print:shadow-none print:max-w-none">
        <div className="flex items-center justify-between p-6 border-b border-border-light print:hidden">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-secondary">
                {t("number")}
              </p>
              <p className="text-2xl font-bold text-text-primary font-mono">
                {receipt.number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-text-secondary">
                {t("date")}
              </p>
              <p className="text-sm font-medium text-text-primary">
                {formatIsoDate(receipt.date, locale, LONG_DATE)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-text-secondary">{t("owner")}</dt>
              <dd className="font-medium text-text-primary">{ownerName}</dd>
            </div>
            {property ? (
              <div>
                <dt className="text-text-secondary">{t("property")}</dt>
                <dd className="font-medium text-text-primary">{property}</dd>
              </div>
            ) : null}
            {unit ? (
              <div>
                <dt className="text-text-secondary">{t("unit")}</dt>
                <dd className="font-medium text-text-primary">{unit}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-text-secondary">{t("method")}</dt>
              <dd className="font-medium text-text-primary">{methodLabel}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-text-secondary">{t("amount")}</dt>
              <dd className="text-xl font-bold text-text-primary">
                {formatCurrency(receipt.amount)}
              </dd>
            </div>
            {receipt.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-text-secondary">{t("notes")}</dt>
                <dd className="font-medium text-text-primary">{receipt.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-6 border-t border-border-light print:hidden">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button type="button" iconName="Printer" onClick={print}>
            {t("print")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
