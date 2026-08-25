import { downloadCsv } from "@/lib/export-csv";
import type { AgingReport, PrestacaoReport, RateioReport } from "./types";

function slug(value: string): string {
  return value.trim().replace(/\s+/g, "-").toLowerCase() || "report";
}

export function exportRateioCsv(report: RateioReport): void {
  downloadCsv(
    [
      "unit",
      "type",
      "floor",
      "owners",
      "permillage",
      "sharePercent",
      "monthlyQuota",
      "annualShare",
    ],
    report.rows.map((row) => [
      row.unitLabel,
      row.unitType,
      row.floor ?? "",
      row.ownerNames.join("; "),
      row.permillage,
      row.sharePercent,
      row.monthlyQuota,
      row.annualShare,
    ]),
    `mapa-rateio-${slug(report.condominiumName)}-${report.year}.csv`,
  );
}

export function exportPrestacaoCsv(report: PrestacaoReport): void {
  downloadCsv(
    ["section", "label", "amount"],
    [
      ...report.ordinary.map((row) => ["budget", row.category, row.amount]),
      ["budget", "reserveFund", report.reserveFund],
      ...report.expensesByCategory.map((row) => [
        "expense",
        row.category,
        row.amount,
      ]),
      ...report.bankAccounts.map((row) => [
        "bank",
        `${row.bank} ${row.iban}`,
        row.balance,
      ]),
      ...report.extraordinary.map((row) => [
        "extraordinary",
        row.description,
        row.totalAmount,
      ]),
    ],
    `prestacao-contas-${slug(report.condominiumName)}-${report.year}.csv`,
  );
}

export function exportAgingCsv(report: AgingReport): void {
  downloadCsv(
    [
      "owner",
      "unit",
      "condominium",
      "period",
      "dueDate",
      "daysOverdue",
      "bucket",
      "status",
      "amount",
    ],
    report.rows.map((row) => [
      row.ownerName,
      row.unitLabel,
      row.condominiumName,
      row.monthYear,
      row.dueDate,
      row.daysOverdue,
      row.bucket,
      row.status,
      row.amount,
    ]),
    `collection-aging-${slug(report.condominiumName ?? "portfolio")}.csv`,
  );
}
