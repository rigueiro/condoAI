"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatPortugueseAddress } from "@/lib/address";
import {
  previewDebt,
  type AccountCharge,
  type AccountReceipt,
  type CertificateView,
} from "@/lib/collections";
import { formatIsoDate, formatMonthYear, todayKey } from "@/lib/collections/dates";
import type { QuotaPayment } from "@/types";
import { usePrintDocument } from "./use-print-document";

type Props = {
  isOpen: boolean;
  ownerId: string;
  ownerName: string;
  quotas: QuotaPayment[];
  charges: AccountCharge[];
  receipts: AccountReceipt[];
  onClose: () => void;
  onIssue: (asOfDate: string) => Promise<CertificateView | null>;
};

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

function itemLabel(
  item: { source: string; description: string },
  locale: string,
  t: ReturnType<typeof useTranslations<"currentAccount.certificate">>,
) {
  if (item.source === "quota") {
    return t("itemQuota", { period: formatMonthYear(item.description, locale) });
  }
  return item.description;
}

function CertificateDocument({
  view,
  locale,
}: {
  view: CertificateView;
  locale: string;
}) {
  const t = useTranslations("currentAccount.certificate");
  const { formatCurrency } = useFormatCurrency();
  const org = view.organization;
  const condoName = view.condominium?.name ?? org?.name ?? "—";
  const administrator = org?.legalName || org?.name || condoName;
  const adminAddress = org
    ? `${org.addressLine1}, ${org.postalCode} ${org.city}`
    : view.condominium
      ? formatPortugueseAddress(view.condominium.address)
      : t("unknownAddress");
  const fractions =
    view.occupancies
      .map((item) => item.unit.label)
      .filter(Boolean)
      .join(", ") || t("noFractions");

  return (
    <article className="space-y-6 text-text-primary">
      <header className="border-b border-border-medium pb-4">
        <p className="text-sm font-medium text-text-secondary">
          {administrator}
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-wide mt-2">
          {t("documentTitle")}
        </h1>
        <p className="font-mono text-sm mt-1">
          {t("number", { number: view.certificate.number })}
        </p>
      </header>

      <p>
        {t("intro", {
          condominium: condoName,
          administrator,
          adminTax: org?.taxId ? ` (NIPC ${org.taxId})` : "",
          adminAddress,
          asOfDate: formatIsoDate(view.certificate.asOfDate, locale, LONG_DATE),
        })}
      </p>
      <p>
        {t("ownerLine", {
          name: view.owner.fullName,
          taxId: view.owner.taxId || t("unknownTaxId"),
          fractions,
        })}
      </p>

      {view.openItems.length === 0 ? (
        <p>{t("noDebt")}</p>
      ) : (
        <table className="min-w-full text-sm">
          <tbody className="divide-y divide-border-light">
            {view.openItems.map((item, index) => (
              <tr key={`${item.date}-${index}`}>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {formatIsoDate(item.date, locale, LONG_DATE)}
                </td>
                <td className="py-2 pr-4">{itemLabel(item, locale, t)}</td>
                <td className="py-2 text-right tabular-nums font-medium">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-text-primary">
              <td colSpan={2} className="py-3 font-semibold">
                {t("total")}
              </td>
              <td className="py-3 text-right tabular-nums font-bold">
                {formatCurrency(view.totalDue)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      <p className="text-sm text-text-secondary">{t("legal")}</p>
      <p>
        {t("issued", {
          issuedAt: formatIsoDate(view.certificate.issuedAt, locale, LONG_DATE),
        })}
      </p>
      <div className="pt-10">
        <p className="border-t border-border-medium inline-block pt-2 min-w-48">
          {t("signature")}
        </p>
      </div>
    </article>
  );
}

function DebtCertificateModal({
  isOpen,
  ownerId,
  ownerName,
  quotas,
  charges,
  receipts,
  onClose,
  onIssue,
}: Props) {
  const t = useTranslations("currentAccount.certificate");
  const locale = useLocale();
  const { formatCurrency } = useFormatCurrency();
  const [asOfDate, setAsOfDate] = useState(todayKey());
  const [view, setView] = useState<CertificateView | null>(null);
  const [saving, setSaving] = useState(false);
  const print = usePrintDocument(Boolean(view));

  useEffect(() => {
    if (!isOpen) return;
    setAsOfDate(todayKey());
    setView(null);
    setSaving(false);
  }, [isOpen]);

  const preview = useMemo(
    () => previewDebt(ownerId, quotas, charges, receipts, asOfDate),
    [ownerId, quotas, charges, receipts, asOfDate],
  );

  if (!isOpen) return null;

  const handleIssue = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const issued = await onIssue(asOfDate);
    setSaving(false);
    if (issued) setView(issued);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4 print:static print:bg-transparent print:p-0 print-document">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none">
        <div className="flex items-center justify-between p-6 border-b border-border-light print:hidden">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {view ? ownerName : t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {view ? (
          <div className="p-8">
            <CertificateDocument view={view} locale={locale} />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-8 print:hidden">
              <Button type="button" variant="outline" onClick={() => setView(null)}>
                {t("back")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
              <Button type="button" iconName="Printer" onClick={print}>
                {t("print")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleIssue} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("asOfDate")}
              </label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAsOfDate(event.target.value)
                }
              />
            </div>

            <div className="rounded-lg border border-border-light p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {t("previewTitle")}
              </h3>
              {preview.items.length === 0 ? (
                <p className="text-sm text-text-secondary">{t("previewEmpty")}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {preview.items.map((item, index) => (
                    <li
                      key={`${item.date}-${index}`}
                      className="flex justify-between gap-4"
                    >
                      <span>
                        {formatIsoDate(item.date, locale, LONG_DATE)} ·{" "}
                        {itemLabel(item, locale, t)}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between gap-4 mt-4 pt-3 border-t border-border-light text-sm font-semibold">
                <span>{t("previewTotal")}</span>
                <span className="tabular-nums">
                  {formatCurrency(preview.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
              <Button type="submit" loading={saving} disabled={saving}>
                {saving ? t("issuing") : t("issue")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DebtCertificateModal;
