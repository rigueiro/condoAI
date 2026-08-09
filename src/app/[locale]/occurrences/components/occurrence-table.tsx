"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import {
  formatOccurrenceDate,
  type OccurrenceRow,
} from "../types";
import { PRIORITY_BADGE, STATE_BADGE } from "./occurrence-meta";

type SortKey =
  | "title"
  | "category"
  | "condominiumName"
  | "priority"
  | "status"
  | "dateTime";
type SortDirection = "asc" | "desc";

interface Props {
  rows: OccurrenceRow[];
  selectedOccurrences: string[];
  onOccurrenceSelect: (id: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onEditOccurrence: (row: OccurrenceRow) => void;
  onDeleteOccurrence: (id: string) => void;
}

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

function SortableHeader({
  children,
  sortKey,
  className = "",
  sortConfig,
  onSort,
}: {
  children: string;
  sortKey: SortKey;
  className?: string;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-secondary-50 transition-smooth ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <Icon
            name="ChevronUp"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "asc" ? "text-primary" : "text-secondary-300"}`}
          />
          <Icon
            name="ChevronDown"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "desc" ? "text-primary" : "text-secondary-300"} -mt-1`}
          />
        </div>
      </div>
    </th>
  );
}

function sortValue(row: OccurrenceRow, key: SortKey): string {
  switch (key) {
    case "condominiumName":
      return row.condominiumName;
    case "title":
      return row.occurrence.title;
    case "category":
      return row.occurrence.category;
    case "priority":
      return row.occurrence.priority;
    case "status":
      return row.occurrence.status;
    case "dateTime":
      return formatOccurrenceDate(row.occurrence.dateTime);
  }
}

function StateBadge({
  status,
  label,
}: {
  status: OccurrenceRow["occurrence"]["status"];
  label: string;
}) {
  const config = STATE_BADGE[status] ?? STATE_BADGE.Open;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      {label}
    </span>
  );
}

function PriorityBadge({
  priority,
  label,
}: {
  priority: OccurrenceRow["occurrence"]["priority"];
  label: string;
}) {
  const config = PRIORITY_BADGE[priority] ?? PRIORITY_BADGE.LOW;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      {label}
    </span>
  );
}

function OccurrenceTable({
  rows,
  selectedOccurrences,
  onOccurrenceSelect,
  onSelectAll,
  onEditOccurrence,
  onDeleteOccurrence,
}: Props) {
  const t = useTranslations("occurrences.table");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedRows = useMemo(() => {
    const key = sortConfig.key;
    if (!key) return rows;

    return [...rows].sort((a, b) => {
      const aValue = sortValue(a, key);
      const bValue = sortValue(b, key);
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [rows, sortConfig]);

  const allSelected =
    rows.length > 0 && selectedOccurrences.length === rows.length;
  const someSelected =
    selectedOccurrences.length > 0 &&
    selectedOccurrences.length < rows.length;

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border-medium text-primary focus:ring-primary"
                />
              </th>
              <SortableHeader
                sortKey="title"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("occurrence")}
              </SortableHeader>
              <SortableHeader
                sortKey="category"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("category")}
              </SortableHeader>
              <SortableHeader
                sortKey="condominiumName"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("property")}
              </SortableHeader>
              <SortableHeader
                sortKey="priority"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("priority")}
              </SortableHeader>
              <SortableHeader
                sortKey="status"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("state")}
              </SortableHeader>
              <SortableHeader
                sortKey="dateTime"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("reportedAt")}
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {sortedRows.map((row) => {
              const { occurrence, condominiumName, ownerName } = row;
              const dateLabel = formatOccurrenceDate(occurrence.dateTime);
              return (
                <tr
                  key={occurrence.id}
                  className="hover:bg-secondary-50 transition-smooth"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOccurrences.includes(occurrence.id)}
                      onChange={(e) =>
                        onOccurrenceSelect(occurrence.id, e.target.checked)
                      }
                      className="rounded border-border-medium text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <Link
                      href={`/occurrences/${occurrence.id}`}
                      className="text-sm font-medium text-text-primary hover:text-primary transition-smooth"
                    >
                      {occurrence.title}
                    </Link>
                    <div className="text-sm text-text-secondary truncate">
                      {t("unitLabel", { unit: occurrence.unit ?? "—" })} •{" "}
                      {ownerName ?? "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary">
                      {tCategory(occurrence.category)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary">
                      {condominiumName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge
                      priority={occurrence.priority}
                      label={tPriority(occurrence.priority)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <StateBadge
                      status={occurrence.status}
                      label={tState(occurrence.status)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-secondary">{dateLabel}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/occurrences/${occurrence.id}`}
                        className="p-1 text-text-secondary hover:text-accent transition-smooth"
                        title={t("viewOccurrence")}
                      >
                        <Icon name="Eye" size={16} />
                      </Link>
                      <button
                        onClick={() => onEditOccurrence(row)}
                        className="p-1 text-text-secondary hover:text-primary transition-smooth"
                        title={t("editOccurrence")}
                      >
                        <Icon name="Edit2" size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteOccurrence(occurrence.id)}
                        className="p-1 text-text-secondary hover:text-error transition-smooth"
                        title={t("deleteOccurrence")}
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-border-light">
        {sortedRows.map((row) => {
          const { occurrence, condominiumName } = row;
          const dateLabel = formatOccurrenceDate(occurrence.dateTime);
          return (
            <div key={occurrence.id} className="p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedOccurrences.includes(occurrence.id)}
                  onChange={(e) =>
                    onOccurrenceSelect(occurrence.id, e.target.checked)
                  }
                  className="mt-1 rounded border-border-medium text-primary focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/occurrences/${occurrence.id}`}
                        className="text-sm font-medium text-text-primary hover:text-primary transition-smooth"
                      >
                        {occurrence.title}
                      </Link>
                      <p className="text-sm text-text-secondary">
                        {tCategory(occurrence.category)} • {condominiumName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditOccurrence(row)}
                        className="p-2 text-text-secondary hover:text-primary transition-smooth"
                      >
                        <Icon name="Edit2" size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteOccurrence(occurrence.id)}
                        className="p-2 text-text-secondary hover:text-error transition-smooth"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <PriorityBadge
                      priority={occurrence.priority}
                      label={tPriority(occurrence.priority)}
                    />
                    <StateBadge
                      status={occurrence.status}
                      label={tState(occurrence.status)}
                    />
                  </div>
                  <div className="mt-2 text-xs text-text-secondary">
                    {t("unitLabel", { unit: occurrence.unit ?? "—" })} •{" "}
                    {dateLabel}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12">
          <Icon
            name="ClipboardList"
            size={48}
            className="mx-auto text-secondary-300 mb-4"
          />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {t("noResults")}
          </h3>
          <p className="text-text-secondary">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}

export default OccurrenceTable;
