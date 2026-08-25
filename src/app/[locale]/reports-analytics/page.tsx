"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Breadcrumb from "@/components/ui/breadcrumb";
import Header from "@/components/ui/header";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { useFinance } from "@/lib/finance";
import { useCollections } from "@/lib/collections";
import { usePortfolio } from "@/lib/portfolio";
import {
  REPORT_KINDS,
  REPORT_TAB_KEYS,
  availableBudgetYears,
  buildAgingReport,
  buildPrestacaoReport,
  buildRateioReport,
  exportAgingCsv,
  exportPrestacaoCsv,
  exportRateioCsv,
  type ReportKind,
} from "@/lib/reports";
import { usePrintDocument } from "@/app/[locale]/owners-management/components/use-print-document";
import { ReportEmpty } from "./components/report-ui";
import MapaRateioReport from "./components/mapa-rateio-report";
import PrestacaoContasReport from "./components/prestacao-contas-report";
import CollectionAgingReport from "./components/collection-aging-report";

const ALL_CONDOS = "__all__";

function ReportsAnalytics() {
  const t = useTranslations("reportsAnalytics");
  const { portfolio } = usePortfolio();
  const { budgets, expenses, accounts, extraordinaryQuotas } = useFinance();
  const { quotas } = useCollections();
  const print = usePrintDocument(true);

  const condominiums = portfolio.condominiums;
  const [reportKind, setReportKind] = useState<ReportKind>("mapa-rateio");
  const [condoFilter, setCondoFilter] = useState("");
  const [year, setYear] = useState(() => new Date().getFullYear());

  const defaultCondoId = condominiums[0]?.id ?? "";
  const resolvedCondoId =
    condoFilter &&
    condoFilter !== ALL_CONDOS &&
    condominiums.some((c) => c.id === condoFilter)
      ? condoFilter
      : defaultCondoId;

  const selectValue =
    reportKind === "collection-aging" && condoFilter === ALL_CONDOS
      ? ALL_CONDOS
      : resolvedCondoId;

  const selectedCondo = useMemo(
    () => condominiums.find((c) => c.id === resolvedCondoId),
    [condominiums, resolvedCondoId],
  );

  const yearOptions = useMemo(() => {
    if (!resolvedCondoId) return [new Date().getFullYear()];
    const current = new Date().getFullYear();
    return [
      ...new Set([
        current,
        current - 1,
        year,
        ...availableBudgetYears(budgets, resolvedCondoId),
      ]),
    ].sort((a, b) => b - a);
  }, [budgets, resolvedCondoId, year]);

  const agingCondoId =
    reportKind === "collection-aging" && condoFilter === ALL_CONDOS
      ? null
      : resolvedCondoId || null;

  const activeReport = useMemo(() => {
    if (!selectedCondo && reportKind !== "collection-aging") return null;

    if (reportKind === "mapa-rateio" && selectedCondo) {
      return {
        kind: "mapa-rateio" as const,
        data: buildRateioReport({
          condominium: selectedCondo,
          units: portfolio.units,
          owners: portfolio.owners,
          budgets,
          year,
        }),
      };
    }

    if (reportKind === "prestacao-contas" && selectedCondo) {
      return {
        kind: "prestacao-contas" as const,
        data: buildPrestacaoReport({
          condominium: selectedCondo,
          year,
          budgets,
          expenses,
          accounts,
          extraordinaryQuotas,
          quotas,
          units: portfolio.units,
        }),
      };
    }

    if (reportKind === "collection-aging") {
      return {
        kind: "collection-aging" as const,
        data: buildAgingReport({
          quotas,
          portfolio,
          condominiumId: agingCondoId,
        }),
      };
    }

    return null;
  }, [
    reportKind,
    selectedCondo,
    portfolio,
    budgets,
    year,
    expenses,
    accounts,
    extraordinaryQuotas,
    quotas,
    agingCondoId,
  ]);

  const handleExport = () => {
    if (!activeReport) return;
    if (activeReport.kind === "mapa-rateio") exportRateioCsv(activeReport.data);
    else if (activeReport.kind === "prestacao-contas") {
      exportPrestacaoCsv(activeReport.data);
    } else exportAgingCsv(activeReport.data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary sm:text-base">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" iconName="Printer" onClick={print}>
              {t("actions.print")}
            </Button>
            <Button
              variant="outline"
              iconName="Download"
              onClick={handleExport}
              disabled={!activeReport}
            >
              {t("actions.exportCsv")}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border-light print:hidden">
          {REPORT_KINDS.map((kind) => {
            const active = reportKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setReportKind(kind)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t(`tabs.${REPORT_TAB_KEYS[kind]}`)}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
            <span className="text-text-secondary">{t("filters.condominium")}</span>
            <Select
              value={selectValue || ALL_CONDOS}
              onChange={(e) => setCondoFilter(e.target.value)}
              disabled={condominiums.length === 0}
            >
              {reportKind === "collection-aging" && (
                <option value={ALL_CONDOS}>
                  {t("filters.allCondominiums")}
                </option>
              )}
              {condominiums.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </Select>
          </label>

          {reportKind !== "collection-aging" && (
            <label className="flex w-full flex-col gap-1 text-sm sm:w-36">
              <span className="text-text-secondary">{t("filters.year")}</span>
              <Select
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>

        <div className="print-document">
          {condominiums.length === 0 ? (
            <ReportEmpty>{t("filters.noCondominiums")}</ReportEmpty>
          ) : activeReport?.kind === "mapa-rateio" ? (
            <MapaRateioReport report={activeReport.data} />
          ) : activeReport?.kind === "prestacao-contas" ? (
            <PrestacaoContasReport report={activeReport.data} />
          ) : activeReport?.kind === "collection-aging" ? (
            <CollectionAgingReport report={activeReport.data} />
          ) : (
            <ReportEmpty>{t("empty.noCondo")}</ReportEmpty>
          )}
        </div>
      </main>
    </div>
  );
}

export default ReportsAnalytics;
