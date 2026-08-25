"use client";

import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { formatPermillage } from "@/lib/portfolio";
import { budgetStatusKey, type RateioReport } from "@/lib/reports";
import { ReportEmpty, ReportStat, ReportTableShell } from "./report-ui";

type Props = {
  report: RateioReport;
};

function MapaRateioReport({ report }: Props) {
  const t = useTranslations("reportsAnalytics.mapaRateio");
  const tEmpty = useTranslations("reportsAnalytics.empty");
  const { formatCurrency, locale } = useFormatCurrency();
  const hasBudget = report.budgetStatus != null;
  const statusKey = budgetStatusKey(report.budgetStatus);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{t("title")}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {hasBudget
            ? t("subtitle", { year: report.year })
            : t("subtitleNoBudget", { name: report.condominiumName })}
        </p>
        <p className="mt-1 text-sm font-medium text-text-primary">
          {report.condominiumName}
          <span className="ml-2 text-xs font-normal text-text-secondary">
            {t(`budgetStatus.${statusKey}`)}
          </span>
        </p>
      </div>

      {!hasBudget && (
        <p className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning">
          {tEmpty("noBudget", { year: report.year })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportStat
          label={t("stats.collectable")}
          value={formatCurrency(report.collectable)}
        />
        <ReportStat
          label={t("stats.monthly")}
          value={formatCurrency(report.monthlyTotal)}
        />
        <ReportStat
          label={t("stats.units")}
          value={String(report.rows.length)}
        />
        <ReportStat
          label={t("stats.permillage")}
          value={`${formatPermillage(report.allocatedPermillage, locale)} / ${formatPermillage(report.totalPermillage, locale)}`}
        />
      </div>

      {report.rows.length === 0 ? (
        <ReportEmpty>{tEmpty("noUnits")}</ReportEmpty>
      ) : (
        <ReportTableShell>
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.unit")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.type")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.floor")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.owners")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.permillage")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.share")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.monthly")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.annual")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {report.rows.map((row) => (
                <tr key={row.unitId} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {row.unitLabel}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {t(`types.${row.unitType}` as "types.apartment")}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {row.floor ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {row.ownerNames.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-primary">
                    {formatPermillage(row.permillage, locale)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">
                    {row.sharePercent.toLocaleString(locale, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-primary">
                    {formatCurrency(row.monthlyQuota)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-primary">
                    {formatCurrency(row.annualShare)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-secondary-50">
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-sm font-semibold text-text-primary"
                >
                  {t("total")}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatPermillage(report.totals.permillage, locale)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {report.totals.permillage > 0
                    ? `${((report.totals.permillage / report.totalPermillage) * 100).toLocaleString(locale, { maximumFractionDigits: 2 })}%`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(report.totals.monthly)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(report.totals.annual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </ReportTableShell>
      )}
    </section>
  );
}

export default MapaRateioReport;
