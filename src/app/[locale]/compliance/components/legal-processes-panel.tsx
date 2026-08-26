"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { LegalProcess } from "@/types";
import { useCompliance } from "@/lib/compliance";
import { usePortfolio } from "@/lib/portfolio";
import RecordsTable from "./records-table";

const STATUS_STYLES: Record<LegalProcess["status"], string> = {
  ongoing: "bg-warning-50 text-warning",
  resolved: "bg-success-50 text-success",
  archived: "bg-secondary-100 text-text-secondary",
};

interface LegalProcessesPanelProps {
  search: string;
  canManage: boolean;
}

function LegalProcessesPanel({ search, canManage }: LegalProcessesPanelProps) {
  const t = useTranslations("compliance.legal");
  const locale = useLocale();
  const { legalProcesses, updateLegalProcess } = useCompliance();
  const { portfolio } = usePortfolio();

  const ownerNameById = useMemo(
    () => new Map(portfolio.owners.map((owner) => [owner.id, owner.fullName])),
    [portfolio.owners],
  );

  const condoNameById = useMemo(
    () => new Map(portfolio.condominiums.map((c) => [c.id, c.name])),
    [portfolio.condominiums],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return legalProcesses;
    return legalProcesses.filter((process) => {
      const owner = ownerNameById.get(process.ownerId) ?? "";
      const condo = condoNameById.get(process.condominiumId) ?? "";
      return (
        process.number.toLowerCase().includes(query) ||
        process.description.toLowerCase().includes(query) ||
        owner.toLowerCase().includes(query) ||
        condo.toLowerCase().includes(query)
      );
    });
  }, [legalProcesses, search, ownerNameById, condoNameById]);

  const handleStatusChange = async (
    process: LegalProcess,
    status: LegalProcess["status"],
  ) => {
    await updateLegalProcess(process.id, { status });
  };

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">{t("intro")}</p>
      <RecordsTable
        headers={[
          t("table.number"),
          t("table.condominium"),
          t("table.owner"),
          t("table.description"),
          t("table.opened"),
          t("table.status"),
          ...(canManage ? [t("table.actions")] : []),
        ]}
        colSpan={canManage ? 7 : 6}
        empty={filtered.length === 0}
      >
        {filtered.map((process) => (
          <tr key={process.id}>
            <td className="px-4 py-3 font-mono text-xs">{process.number}</td>
            <td className="px-4 py-3">
              {condoNameById.get(process.condominiumId) ?? "—"}
            </td>
            <td className="px-4 py-3">
              {ownerNameById.get(process.ownerId) ?? "—"}
            </td>
            <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
              {process.description}
            </td>
            <td className="px-4 py-3 text-text-secondary text-xs">
              {dateFormatter.format(new Date(process.openedAt))}
            </td>
            <td className="px-4 py-3">
              {canManage ? (
                <Select
                  value={process.status}
                  onChange={(event) =>
                    handleStatusChange(
                      process,
                      event.target.value as LegalProcess["status"],
                    )
                  }
                  selectSize="sm"
                >
                  <option value="ongoing">{t("status.ongoing")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                  <option value="archived">{t("status.archived")}</option>
                </Select>
              ) : (
                <span
                  className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[process.status]}`}
                >
                  {t(`status.${process.status}`)}
                </span>
              )}
            </td>
            {canManage && (
              <td className="px-4 py-3 text-right">
                {process.certificateId && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Icon name="FileText" size={14} />
                    {t("linkedCertificate")}
                  </span>
                )}
              </td>
            )}
          </tr>
        ))}
      </RecordsTable>
      {!canManage && filtered.length > 0 && (
        <p className="mt-3 text-xs text-text-secondary">{t("readOnlyHint")}</p>
      )}
    </div>
  );
}

export default LegalProcessesPanel;
