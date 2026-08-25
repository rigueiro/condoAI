"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import { downloadCsv } from "@/lib/export-csv";
import { useActiveCondominium, usePortfolio } from "@/lib/portfolio";
import { useOccurrences } from "@/lib/occurrences";

import NewOccurrenceModal from "./components/new-occurrence-modal";
import OccurrenceStatistics from "./components/occurrence-statistics";
import OccurrenceFilters, {
  type OccurrenceFiltersState,
} from "./components/occurrence-filters";
import OccurrenceTable from "./components/occurrence-table";
import BulkOperations from "./components/bulk-operations";
import {
  formatOccurrenceDate,
  occurrenceMatchesSearch,
  toOccurrenceRows,
  type Occurrence,
  type OccurrenceRow,
} from "./types";

function OccurrencesPage() {
  const t = useTranslations("occurrences");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");
  const { portfolio } = usePortfolio();
  const { activeId, preferredId } = useActiveCondominium();
  const { condominiums, owners, units } = portfolio;
  const {
    occurrences,
    upsertOccurrence,
    removeOccurrences,
    markOccurrencesResolved,
  } = useOccurrences();

  const [selectedOccurrences, setSelectedOccurrences] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(
    null,
  );
  const [filters, setFilters] = useState<OccurrenceFiltersState>({
    search: "",
    condominiumId: "",
    category: "",
    state: "",
    priority: "",
  });

  const occurrenceRows = useMemo(
    () => toOccurrenceRows(occurrences, condominiums, owners),
    [occurrences, condominiums, owners],
  );

  const scopedRows = useMemo(
    () =>
      activeId
        ? occurrenceRows.filter(
            (row) => row.occurrence.condominiumId === activeId,
          )
        : occurrenceRows,
    [activeId, occurrenceRows],
  );

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return scopedRows.filter((row) => {
      const { occurrence } = row;
      return (
        occurrenceMatchesSearch(row, q) &&
        (!filters.category || occurrence.category === filters.category) &&
        (!filters.state || occurrence.status === filters.state) &&
        (!filters.priority || occurrence.priority === filters.priority)
      );
    });
  }, [scopedRows, filters]);

  const handleAddOccurrence = useCallback(() => {
    setEditingOccurrence(null);
    setIsModalOpen(true);
  }, []);

  const handleEditOccurrence = useCallback((row: OccurrenceRow) => {
    setEditingOccurrence(row.occurrence);
    setIsModalOpen(true);
  }, []);

  const handleDeleteOccurrence = useCallback(
    (id: string) => {
      if (!window.confirm(t("confirmDelete"))) return;
      removeOccurrences([id]);
      setSelectedOccurrences((prev) => prev.filter((sid) => sid !== id));
    },
    [t, removeOccurrences],
  );

  const handleSaveOccurrence = useCallback(
    (occurrence: Occurrence) => {
      upsertOccurrence(occurrence);
      setIsModalOpen(false);
      setEditingOccurrence(null);
    },
    [upsertOccurrence],
  );

  const handleOccurrenceSelect = useCallback(
    (id: string, isSelected: boolean) => {
      setSelectedOccurrences((prev) =>
        isSelected ? [...prev, id] : prev.filter((sid) => sid !== id),
      );
    },
    [],
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      setSelectedOccurrences(
        isSelected ? filteredRows.map((r) => r.occurrence.id) : [],
      );
    },
    [filteredRows],
  );

  const handleBulkMarkResolved = useCallback(() => {
    markOccurrencesResolved(selectedOccurrences);
    setSelectedOccurrences([]);
  }, [selectedOccurrences, markOccurrencesResolved]);

  const handleBulkExport = useCallback(() => {
    const selected = occurrenceRows.filter((r) =>
      selectedOccurrences.includes(r.occurrence.id),
    );
    const headers = [
      t("stats.csvHeaders.title"),
      t("stats.csvHeaders.category"),
      t("stats.csvHeaders.property"),
      t("stats.csvHeaders.unit"),
      t("stats.csvHeaders.priority"),
      t("stats.csvHeaders.state"),
      t("stats.csvHeaders.reportedBy"),
      t("stats.csvHeaders.reportedAt"),
      t("stats.csvHeaders.assignedTo"),
    ];
    const rows = selected.map(({ occurrence, condominiumName, ownerName }) => [
      occurrence.title,
      tCategory(occurrence.category),
      condominiumName,
      occurrence.unit ?? "",
      tPriority(occurrence.priority),
      tState(occurrence.status),
      ownerName ?? "",
      formatOccurrenceDate(occurrence.dateTime),
      occurrence.assignedTo ?? "",
    ]);
    downloadCsv(headers, rows, "occurrences-selected.csv");
  }, [occurrenceRows, selectedOccurrences, t, tCategory, tPriority, tState]);

  const handleBulkDelete = useCallback(() => {
    if (!window.confirm(t("confirmDeleteSelected"))) return;
    removeOccurrences(selectedOccurrences);
    setSelectedOccurrences([]);
  }, [selectedOccurrences, t, removeOccurrences]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbNavigation />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {t("title")}
              </h1>
              <p className="text-text-secondary">{t("subtitle")}</p>
            </div>
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddOccurrence}
                className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
              >
                <Icon name="Plus" size={20} />
                <span>{t("addOccurrence")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <OccurrenceStatistics rows={scopedRows} />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <OccurrenceFilters
                filters={filters}
                onFiltersChange={setFilters}
              />

              {selectedOccurrences.length > 0 && (
                <BulkOperations
                  selectedCount={selectedOccurrences.length}
                  onClearSelection={() => setSelectedOccurrences([])}
                  onMarkResolved={handleBulkMarkResolved}
                  onExportSelected={handleBulkExport}
                  onDeleteSelected={handleBulkDelete}
                />
              )}

              <OccurrenceTable
                rows={filteredRows}
                selectedOccurrences={selectedOccurrences}
                onOccurrenceSelect={handleOccurrenceSelect}
                onSelectAll={handleSelectAll}
                onEditOccurrence={handleEditOccurrence}
                onDeleteOccurrence={handleDeleteOccurrence}
              />
            </div>
          </div>
      </div>

      {isModalOpen && (
        <NewOccurrenceModal
          occurrence={editingOccurrence}
          condominiums={condominiums}
          owners={owners}
          units={units}
          defaultCondominiumId={preferredId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOccurrence(null);
          }}
          onSave={handleSaveOccurrence}
        />
      )}
    </div>
  );
}

export default OccurrencesPage;
