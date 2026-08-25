"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatIsoDate } from "@/lib/collections/dates";
import { budgetStatusKey, type PrestacaoReport } from "@/lib/reports";
import { ReportEmpty, ReportStat, ReportTableShell } from "./report-ui";

type Props = {
  report: PrestacaoReport;
};

function AmountTable({
  headers,
  rows,
  footer,
}: {
  headers: [string, string];
  rows: { key: string; label: string; amount: string }[];
  footer?: { label: string; amount: string };
}) {
  return (
    <ReportTableShell>
      <table className="min-w-full divide-y divide-border-light">
        <thead className="bg-secondary-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              {headers[0]}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-secondary-50">
              <td className="px-4 py-3 text-sm text-text-primary">{row.label}</td>
              <td className="px-4 py-3 text-right text-sm text-text-primary">
                {row.amount}
              </td>
            </tr>
          ))}
        </tbody>
        {footer ? (
          <tfoot className="bg-secondary-50">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                {footer.label}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                {footer.amount}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </ReportTableShell>
  );
}

function PrestacaoContasReport({ report }: Props) {
  const t = useTranslations("reportsAnalytics.prestacaoContas");
  const { formatCurrency } = useFormatCurrency();
  const locale = useLocale();
  const statusKey = budgetStatusKey(report.budgetStatus);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{t("title")}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("subtitle", { name: report.condominiumName, year: report.year })}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          {t(`budgetStatus.${statusKey}`)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportStat
          label={t("stats.collectable")}
          value={formatCurrency(report.collectable)}
        />
        <ReportStat
          label={t("stats.expenses")}
          value={formatCurrency(report.expenseTotal)}
        />
        <ReportStat
          label={t("stats.variance")}
          value={formatCurrency(report.variance)}
        />
        <ReportStat
          label={t("stats.bank")}
          value={formatCurrency(report.bankTotal)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("budget.title")}
          </h3>
          {report.ordinary.length === 0 ? (
            <ReportEmpty compact>{t("budget.empty")}</ReportEmpty>
          ) : (
            <AmountTable
              headers={[t("budget.category"), t("budget.amount")]}
              rows={report.ordinary.map((row) => ({
                key: row.category,
                label: row.category,
                amount: formatCurrency(row.amount),
              }))}
              footer={{
                label: t("budget.ordinary"),
                amount: formatCurrency(report.ordinaryTotal),
              }}
            />
          )}
          <dl className="space-y-2 rounded-lg border border-border-light bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">{t("budget.reserve")}</dt>
              <dd className="font-medium text-text-primary">
                {formatCurrency(report.reserveFund)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">
                {t("budget.minimumReserve")}
              </dt>
              <dd className="text-text-primary">
                {formatCurrency(report.minimumReserve)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border-light pt-2">
              <dt className="font-medium text-text-primary">
                {t("budget.collectable")}
              </dt>
              <dd className="font-semibold text-text-primary">
                {formatCurrency(report.collectable)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("expenses.title")}
          </h3>
          {report.expensesByCategory.length === 0 ? (
            <ReportEmpty compact>{t("expenses.empty")}</ReportEmpty>
          ) : (
            <AmountTable
              headers={[t("expenses.category"), t("expenses.amount")]}
              rows={report.expensesByCategory.map((row) => ({
                key: row.category,
                label: row.category,
                amount: formatCurrency(row.amount),
              }))}
              footer={{
                label: t("expenses.total"),
                amount: formatCurrency(report.expenseTotal),
              }}
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("bank.title")}
        </h3>
        {report.bankAccounts.length === 0 ? (
          <ReportEmpty compact>{t("bank.empty")}</ReportEmpty>
        ) : (
          <ReportTableShell>
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("bank.bank")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("bank.iban")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("bank.balance")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {report.bankAccounts.map((account) => (
                  <tr key={account.iban} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {account.bank}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-text-secondary">
                      {account.iban}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-primary">
                      {formatCurrency(account.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-secondary-50">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-semibold text-text-primary"
                  >
                    {t("bank.total")}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                    {formatCurrency(report.bankTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </ReportTableShell>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("extraordinary.title")}
        </h3>
        {report.extraordinary.length === 0 ? (
          <ReportEmpty compact>{t("extraordinary.empty")}</ReportEmpty>
        ) : (
          <ReportTableShell>
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("extraordinary.description")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("extraordinary.date")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("extraordinary.owners")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("extraordinary.amount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {report.extraordinary.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatIsoDate(item.date, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">
                      {item.ownerCount}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-primary">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-secondary-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-sm font-semibold text-text-primary"
                  >
                    {t("extraordinary.total")}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                    {formatCurrency(report.extraordinaryTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </ReportTableShell>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("collections.title", { year: report.year })}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ReportStat
            label={t("collections.paid")}
            value={String(report.quotas.paid)}
          />
          <ReportStat
            label={t("collections.pending")}
            value={String(report.quotas.pending)}
          />
          <ReportStat
            label={t("collections.overdue")}
            value={String(report.quotas.overdue)}
          />
          <ReportStat
            label={t("collections.paidAmount")}
            value={formatCurrency(report.quotas.paidAmount)}
          />
          <ReportStat
            label={t("collections.outstanding")}
            value={formatCurrency(report.quotas.outstandingAmount)}
          />
        </div>
      </div>
    </section>
  );
}

export default PrestacaoContasReport;
