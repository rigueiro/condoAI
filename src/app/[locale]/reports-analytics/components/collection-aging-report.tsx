"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatIsoDate, formatMonthYear } from "@/lib/collections/dates";
import type { AgingReport } from "@/lib/reports";
import { ReportEmpty, ReportStat, ReportTableShell } from "./report-ui";

type Props = {
  report: AgingReport;
};

function CollectionAgingReport({ report }: Props) {
  const t = useTranslations("reportsAnalytics.aging");
  const tEmpty = useTranslations("reportsAnalytics.empty");
  const { formatCurrency } = useFormatCurrency();
  const locale = useLocale();
  const asOf = formatIsoDate(report.asOf, locale);
  const showProperty = !report.condominiumId;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{t("title")}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {report.condominiumName
            ? t("subtitleCondo", { name: report.condominiumName, date: asOf })
            : t("subtitle", { date: asOf })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        <ReportStat
          className="lg:col-span-2"
          label={t("stats.total")}
          value={formatCurrency(report.totalAmount)}
          hint={`${t("stats.items")}: ${report.totalCount}`}
        />
        {report.buckets.map((bucket) => (
          <ReportStat
            key={bucket.id}
            label={t(`buckets.${bucket.id}`)}
            value={formatCurrency(bucket.amount)}
            hint={String(bucket.count)}
          />
        ))}
      </div>

      {report.rows.length === 0 ? (
        <ReportEmpty>{tEmpty("noAging")}</ReportEmpty>
      ) : (
        <ReportTableShell>
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.owner")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.unit")}
                </th>
                {showProperty && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t("columns.property")}
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.period")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.dueDate")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.days")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.bucket")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.status")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.amount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {report.rows.map((row) => (
                <tr key={row.quotaId} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {row.ownerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {row.unitLabel || "—"}
                  </td>
                  {showProperty && (
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {row.condominiumName || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatMonthYear(row.monthYear, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatIsoDate(row.dueDate, locale)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-primary">
                    {row.daysOverdue}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {t(`buckets.${row.bucket}`)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        row.status === "overdue" ? "text-error" : "text-warning"
                      }
                    >
                      {t(`status.${row.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text-primary">
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportTableShell>
      )}
    </section>
  );
}

export default CollectionAgingReport;
