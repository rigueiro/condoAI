"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/ui/header";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import { downloadCsv } from "@/lib/export-csv";
import { mockProperties } from "@/app/[locale]/owners-management/__fixtures__/mock-properties";

import NewOccurrenceModal from "./components/new-occurrence-modal";
import OccurrenceStatistics from "./components/occurrence-statistics";
import OccurrenceFilters, {
  type OccurrenceFiltersState,
} from "./components/occurrence-filters";
import OccurrenceTable from "./components/occurrence-table";
import BulkOperations from "./components/bulk-operations";
import { mockOccurrences } from "./__fixtures__/mock-occurrences";
import { Occurrence } from "./types";

function OccurrencesPage() {
  const t = useTranslations("occurrences");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");

  const [occurrences, setOccurrences] = useState<Occurrence[]>(mockOccurrences);
  const [selectedOccurrences, setSelectedOccurrences] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(
    null,
  );
  const [filters, setFilters] = useState<OccurrenceFiltersState>({
    search: "",
    property: "",
    category: "",
    state: "",
    priority: "",
  });

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occurrence) => {
      const matchesSearch =
        !filters.search ||
        occurrence.title
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        occurrence.description
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (occurrence.unit ?? "")
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        occurrence.reportedBy
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesProperty =
        !filters.property || occurrence.property === filters.property;

      const matchesCategory =
        !filters.category || occurrence.category === filters.category;

      const matchesState =
        !filters.state || occurrence.state === filters.state;

      const matchesPriority =
        !filters.priority || occurrence.priority === filters.priority;

      return (
        matchesSearch &&
        matchesProperty &&
        matchesCategory &&
        matchesState &&
        matchesPriority
      );
    });
  }, [occurrences, filters]);

  const handleAddOccurrence = useCallback(() => {
    setEditingOccurrence(null);
    setIsModalOpen(true);
  }, []);

  const handleEditOccurrence = useCallback((occurrence: Occurrence) => {
    setEditingOccurrence(occurrence);
    setIsModalOpen(true);
  }, []);

  const handleDeleteOccurrence = useCallback(
    (id: string) => {
      if (!window.confirm(t("confirmDelete"))) return;
      setOccurrences((prev) => prev.filter((o) => o.id !== id));
      setSelectedOccurrences((prev) => prev.filter((sid) => sid !== id));
    },
    [t],
  );

  const handleSaveOccurrence = useCallback(
    (occurrence: Occurrence) => {
      setOccurrences((prev) => {
        if (occurrence.id) {
          return prev.map((o) => (o.id === occurrence.id ? occurrence : o));
        }
        return [{ ...occurrence, id: uuidv4() }, ...prev];
      });
      setIsModalOpen(false);
      setEditingOccurrence(null);
    },
    [],
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
        isSelected ? filteredOccurrences.map((o) => o.id) : [],
      );
    },
    [filteredOccurrences],
  );

  const handleBulkMarkResolved = useCallback(() => {
    setOccurrences((prev) =>
      prev.map((o) =>
        selectedOccurrences.includes(o.id)
          ? { ...o, state: "Resolved" }
          : o,
      ),
    );
    setSelectedOccurrences([]);
  }, [selectedOccurrences]);

  const handleBulkExport = useCallback(() => {
    const selected = occurrences.filter((o) =>
      selectedOccurrences.includes(o.id),
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
    const rows = selected.map((o) => [
      o.title,
      tCategory(o.category),
      o.property ?? "",
      o.unit ?? "",
      tPriority(o.priority),
      tState(o.state),
      o.reportedBy,
      o.reportedAt,
      o.assignedTo ?? "",
    ]);
    downloadCsv(headers, rows, "occurrences-selected.csv");
  }, [occurrences, selectedOccurrences, t, tCategory, tPriority, tState]);

  const handleBulkDelete = useCallback(() => {
    if (!window.confirm(t("confirmDeleteSelected"))) return;
    setOccurrences((prev) =>
      prev.filter((o) => !selectedOccurrences.includes(o.id)),
    );
    setSelectedOccurrences([]);
  }, [selectedOccurrences, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbNavigation />

          {/* Page Header */}
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
            {/* Left Sidebar - Statistics */}
            <div className="lg:col-span-1">
              <OccurrenceStatistics occurrences={occurrences} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <OccurrenceFilters
                filters={filters}
                onFiltersChange={setFilters}
                properties={mockProperties}
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
                occurrences={filteredOccurrences}
                selectedOccurrences={selectedOccurrences}
                onOccurrenceSelect={handleOccurrenceSelect}
                onSelectAll={handleSelectAll}
                onEditOccurrence={handleEditOccurrence}
                onDeleteOccurrence={handleDeleteOccurrence}
              />
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <NewOccurrenceModal
          occurrence={editingOccurrence}
          properties={mockProperties}
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
