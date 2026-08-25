"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PropertyTable from "./components/property-table";
import PropertyModal from "./components/property-modal";
import PropertyFilters from "./components/property-filters";
import PropertyStats from "./components/property-stats";
import BulkActionsBar from "./components/bulk-actions-bar";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import type { SortConfig } from "./types";
import type { Condominium } from "@/types";
import { downloadCsv } from "@/lib/export-csv";
import { useCollections } from "@/lib/collections";
import {
  condoStats,
  formatPortugueseAddress,
  usePortfolio,
} from "@/lib/portfolio";
import { mockCondoStats } from "@/fixtures/views";

function PropertiesManagement() {
  const t = useTranslations("propertiesManagement");
  const {
    portfolio,
    isDemo,
    upsertCondominium,
    removeCondominium,
  } = usePortfolio();
  const { quotas } = useCollections();

  const rows = useMemo(
    () =>
      portfolio.condominiums.map((condo) => ({
        condo,
        stats: isDemo
          ? mockCondoStats(condo)
          : condoStats(condo, portfolio, quotas),
      })),
    [portfolio, isDemo, quotas],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [unitRangeFilter, setUnitRangeFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium>();

  const filteredAndSortedRows = useMemo(() => {
    const filtered = rows.filter(({ condo }) => {
      const address = formatPortugueseAddress(condo.address);
      const matchesSearch =
        condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        !locationFilter ||
        address.toLowerCase().includes(locationFilter.toLowerCase()) ||
        condo.address.municipality
          .toLowerCase()
          .includes(locationFilter.toLowerCase());

      const matchesUnitRange =
        !unitRangeFilter ||
        (() => {
          switch (unitRangeFilter) {
            case "small":
              return condo.numberOfUnits <= 30;
            case "medium":
              return condo.numberOfUnits > 30 && condo.numberOfUnits <= 60;
            case "large":
              return condo.numberOfUnits > 60;
            default:
              return true;
          }
        })();

      return matchesSearch && matchesLocation && matchesUnitRange;
    });

    filtered.sort((a, b) => {
      const pick = (row: (typeof rows)[number]) => {
        switch (sortConfig.key) {
          case "name":
            return row.condo.name;
          case "totalUnits":
            return row.condo.numberOfUnits;
          case "occupiedUnits":
            return row.stats.occupiedUnits;
          case "averageFee":
            return row.stats.averageFee;
          case "collectionRate":
            return row.stats.collectionRate;
        }
      };
      const aValue = pick(a);
      const bValue = pick(b);
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rows, searchTerm, locationFilter, unitRangeFilter, sortConfig]);

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig?.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleAddProperty = () => {
    setEditingCondo(undefined);
    setIsModalOpen(true);
  };

  const handleEditProperty = (condo: Condominium) => {
    setEditingCondo(condo);
    setIsModalOpen(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (window.confirm(t("confirmDeleteUndone"))) {
      removeCondominium(propertyId);
      setSelectedProperties((prev) => prev.filter((id) => id !== propertyId));
    }
  };

  const handleSaveProperty = (condo: Condominium) => {
    upsertCondominium(condo);
    setIsModalOpen(false);
    setEditingCondo(undefined);
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredAndSortedRows.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredAndSortedRows.map((r) => r.condo.id));
    }
  };

  const handleBulkDelete = () => {
    if (
      window.confirm(
        t("confirmBulkDeleteUndone", { count: selectedProperties.length }),
      )
    ) {
      for (const id of selectedProperties) {
        removeCondominium(id);
      }
      setSelectedProperties([]);
    }
  };

  const handleBulkExport = () => {
    const selectedData = rows.filter((r) =>
      selectedProperties.includes(r.condo.id),
    );
    const headers = [
      t("csvHeaders.name"),
      t("csvHeaders.address"),
      t("csvHeaders.totalUnits"),
      t("csvHeaders.occupiedUnits"),
      t("csvHeaders.monthlyFeeRange"),
      t("csvHeaders.collectionRate"),
      t("csvHeaders.taxId"),
    ];
    const csvRows = selectedData.map(({ condo, stats }) => [
      condo.name,
      formatPortugueseAddress(condo.address),
      condo.numberOfUnits,
      stats.occupiedUnits,
      stats.monthlyFeeRange,
      `${stats.collectionRate}%`,
      condo.taxId,
    ]);

    downloadCsv(headers, csvRows, "properties-export.csv");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {t("title")}
              </h1>
              <p className="text-text-secondary">{t("subtitle")}</p>
            </div>

            <div className="mt-4 lg:mt-0">
              <button
                onClick={handleAddProperty}
                className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
              >
                <Icon name="Plus" size={20} />
                <span>{t("addProperty")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
              <PropertyFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                locationFilter={locationFilter}
                onLocationChange={setLocationFilter}
                unitRangeFilter={unitRangeFilter}
                onUnitRangeChange={setUnitRangeFilter}
              />

              {selectedProperties.length > 0 && (
                <BulkActionsBar
                  selectedCount={selectedProperties.length}
                  onBulkDelete={handleBulkDelete}
                  onBulkExport={handleBulkExport}
                  onClearSelection={() => setSelectedProperties([])}
                />
              )}

              <PropertyTable
                rows={filteredAndSortedRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectedProperties={selectedProperties}
                onSelectProperty={handleSelectProperty}
                onSelectAll={handleSelectAll}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
              />
            </div>

            <div className="xl:col-span-1">
              <PropertyStats rows={rows} />
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <PropertyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCondo(undefined);
          }}
          onSave={handleSaveProperty}
          property={editingCondo}
        />
      )}
    </div>
  );
}

export default PropertiesManagement;
