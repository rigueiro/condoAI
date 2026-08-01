"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import PropertyTable from "./components/property-table";
import PropertyModal from "./components/property-modal";
import PropertyFilters from "./components/property-filters";
import PropertyStats from "./components/property-stats";
import BulkActionsBar from "./components/bulk-actions-bar";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import { Property, SortConfig } from "./types";
import { downloadCsv } from "@/lib/export-csv";
import { usePortfolio } from "@/lib/portfolio";

function PropertiesManagement() {
  const t = useTranslations("propertiesManagement");
  const { properties: portfolioProperties } = usePortfolio();
  const [properties, setProperties] = useState<Property[]>([]);

  React.useEffect(() => {
    setProperties([...portfolioProperties]);
  }, [portfolioProperties]);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [unitRangeFilter, setUnitRangeFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property>();

  // TODO const { data, error } = useSWR("/api/properties", fetcher);

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        !locationFilter ||
        property.address.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesUnitRange =
        !unitRangeFilter ||
        (() => {
          switch (unitRangeFilter) {
            case "small":
              return property.totalUnits <= 30;
            case "medium":
              return property.totalUnits > 30 && property.totalUnits <= 60;
            case "large":
              return property.totalUnits > 60;
            default:
              return true;
          }
        })();

      return matchesSearch && matchesLocation && matchesUnitRange;
    });

    // Sort properties
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (
          sortConfig.key === "collectionRate" ||
          sortConfig.key === "totalUnits"
        ) {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [properties, searchTerm, locationFilter, unitRangeFilter, sortConfig]);

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
    setEditingProperty(undefined);
    setIsModalOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (
      window.confirm(t("confirmDeleteUndone"))
    ) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setSelectedProperties((prev) => prev.filter((id) => id !== propertyId));
    }
  };

  const handleSaveProperty = (propertyData: Property) => {
    if (editingProperty) {
      // Update existing property
      setProperties((prev) =>
        prev.map((p) =>
          p.id === editingProperty.id
            ? {
                ...propertyData,
                id: editingProperty.id,
                lastUpdated: new Date().toISOString().split("T")[0],
              }
            : p,
        ),
      );
    } else {
      // Add new property
      const newProperty = {
        ...propertyData,
        id: "400",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      setProperties((prev) => [...prev, newProperty]);
    }
    setIsModalOpen(false);
    setEditingProperty(undefined);
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredAndSortedProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredAndSortedProperties.map((p) => p.id));
    }
  };

  const handleBulkDelete = () => {
    if (
      window.confirm(
        t("confirmBulkDeleteUndone", { count: selectedProperties.length }),
      )
    ) {
      setProperties((prev) =>
        prev.filter((p) => !selectedProperties.includes(p.id)),
      );
      setSelectedProperties([]);
    }
  };

  const handleBulkExport = () => {
    const selectedData = properties.filter((p) =>
      selectedProperties.includes(p.id),
    );
    const headers = [
      t("csvHeaders.name"),
      t("csvHeaders.address"),
      t("csvHeaders.totalUnits"),
      t("csvHeaders.occupiedUnits"),
      t("csvHeaders.monthlyFeeRange"),
      t("csvHeaders.collectionRate"),
      t("csvHeaders.status"),
    ];
    const rows = selectedData.map((p) => [
      p.name,
      p.address,
      p.totalUnits,
      p.occupiedUnits,
      p.monthlyFeeRange,
      `${p.collectionRate}%`,
      p.status,
    ]);

    downloadCsv(headers, rows, "properties-export.csv");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          {/* Page Header */}
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
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              {/* Filters and Search */}
              <PropertyFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                locationFilter={locationFilter}
                onLocationChange={setLocationFilter}
                unitRangeFilter={unitRangeFilter}
                onUnitRangeChange={setUnitRangeFilter}
              />

              {/* Bulk Actions Bar */}
              {selectedProperties.length > 0 && (
                <BulkActionsBar
                  selectedCount={selectedProperties.length}
                  onBulkDelete={handleBulkDelete}
                  onBulkExport={handleBulkExport}
                  onClearSelection={() => setSelectedProperties([])}
                />
              )}

              {/* Properties Table */}
              <PropertyTable
                properties={filteredAndSortedProperties}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectedProperties={selectedProperties}
                onSelectProperty={handleSelectProperty}
                onSelectAll={handleSelectAll}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
              />
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1">
              <PropertyStats properties={properties} />
            </div>
          </div>
        </div>
      </main>

      {/* Property Modal */}
      {isModalOpen && (
        <PropertyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(undefined);
          }}
          onSave={handleSaveProperty}
          property={editingProperty}
        />
      )}
    </div>
  );
}

export default PropertiesManagement;
