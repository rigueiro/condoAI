"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { Occurrence } from "../types";
import { PRIORITY_BADGE, STATE_BADGE } from "./occurrence-meta";

type SortKey = keyof Occurrence;
type SortDirection = "asc" | "desc";

interface Props {
  occurrences: Occurrence[];
  selectedOccurrences: string[];
  onOccurrenceSelect: (id: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onEditOccurrence: (occurrence: Occurrence) => void;
  onDeleteOccurrence: (id: string) => void;
}

function OccurrenceTable({
  occurrences,
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
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: SortDirection;
  }>({ key: null, direction: "asc" });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedOccurrences = React.useMemo(() => {
    const key = sortConfig.key;
    if (!key) return occurrences;

    return [...occurrences].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [occurrences, sortConfig]);

  const StateBadge = ({ occurrence }: { occurrence: Occurrence }) => {
    const config = STATE_BADGE[occurrence.state] ?? STATE_BADGE.Open;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        {tState(occurrence.state)}
      </span>
    );
  };

  const PriorityBadge = ({ occurrence }: { occurrence: Occurrence }) => {
    const config = PRIORITY_BADGE[occurrence.priority] ?? PRIORITY_BADGE.LOW;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        {tPriority(occurrence.priority)}
      </span>
    );
  };

  const SortableHeader = ({
    children,
    sortKey,
    className = "",
  }: {
    children: string;
    sortKey: SortKey;
    className?: string;
  }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-secondary-50 transition-smooth ${className}`}
      onClick={() => handleSort(sortKey)}
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

  const allSelected =
    occurrences.length > 0 &&
    selectedOccurrences.length === occurrences.length;
  const someSelected =
    selectedOccurrences.length > 0 &&
    selectedOccurrences.length < occurrences.length;

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      {/* Desktop Table */}
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
              <SortableHeader sortKey="title">{t("occurrence")}</SortableHeader>
              <SortableHeader sortKey="category">{t("category")}</SortableHeader>
              <SortableHeader sortKey="property">{t("property")}</SortableHeader>
              <SortableHeader sortKey="priority">{t("priority")}</SortableHeader>
              <SortableHeader sortKey="state">{t("state")}</SortableHeader>
              <SortableHeader sortKey="reportedAt">
                {t("reportedAt")}
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {sortedOccurrences.map((occurrence) => (
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
                    {occurrence.reportedBy}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {tCategory(occurrence.category)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {occurrence.property ?? "—"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge occurrence={occurrence} />
                </td>
                <td className="px-6 py-4">
                  <StateBadge occurrence={occurrence} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary">
                    {occurrence.reportedAt}
                  </div>
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
                      onClick={() => onEditOccurrence(occurrence)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border-light">
        {sortedOccurrences.map((occurrence) => (
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
                      {tCategory(occurrence.category)} •{" "}
                      {occurrence.property ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditOccurrence(occurrence)}
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
                  <PriorityBadge occurrence={occurrence} />
                  <StateBadge occurrence={occurrence} />
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  {t("unitLabel", { unit: occurrence.unit ?? "—" })} •{" "}
                  {occurrence.reportedAt}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {occurrences.length === 0 && (
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
