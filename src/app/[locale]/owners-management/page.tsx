"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";

import OwnerModal, { type OwnerFormSave } from "./components/owner-modal";
import OwnerStatistics from "./components/owner-statistics";
import OwnerFilters from "./components/owner-filters";
import OwnerTable from "./components/owner-table";
import BulkOperations from "./components/bulk-operations";
import { type OwnerRow, type PaymentStatus } from "./components/types";
import {
  ownerFromFormSave,
  usePortfolio,
} from "@/lib/portfolio";
import { useCollections } from "@/lib/collections";

interface Filters {
  search: string;
  property: string;
  paymentStatus: PaymentStatus;
  balanceRange: string;
}

function OwnersManagement() {
  const t = useTranslations("ownersManagement");
  const { portfolio, upsertOwner, removeOwner } = usePortfolio();
  const { ownersWithBalances } = useCollections();
  const portfolioProperties = portfolio.condominiums.map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerRow | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    property: "",
    paymentStatus: "",
    balanceRange: "",
  });

  const filteredOwners = useMemo(() => {
    return ownersWithBalances.filter((row) => {
      const { owner } = row;
      const matchesSearch =
        !filters.search ||
        owner.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.unitLabel.toLowerCase().includes(filters.search.toLowerCase()) ||
        owner.contacts.email
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesProperty =
        !filters.property || row.condominiumName === filters.property;

      const matchesPaymentStatus =
        !filters.paymentStatus || row.paymentStatus === filters.paymentStatus;

      const matchesBalanceRange =
        !filters.balanceRange ||
        (() => {
          switch (filters.balanceRange) {
            case "zero":
              return row.currentBalance === 0;
            case "low":
              return row.currentBalance > 0 && row.currentBalance <= 1000;
            case "medium":
              return (
                row.currentBalance > 1000 && row.currentBalance <= 3000
              );
            case "high":
              return row.currentBalance > 3000;
            default:
              return true;
          }
        })();

      return (
        matchesSearch &&
        matchesProperty &&
        matchesPaymentStatus &&
        matchesBalanceRange
      );
    });
  }, [filters, ownersWithBalances]);

  const handleAddOwner = () => {
    setEditingOwner(null);
    setIsOwnerModalOpen(true);
  };

  const handleEditOwner = (row: OwnerRow) => {
    setEditingOwner(row);
    setIsOwnerModalOpen(true);
  };

  const handleDeleteOwner = (ownerId: string) => {
    if (window.confirm(t("confirmDeleteUndone"))) {
      removeOwner(ownerId);
      setSelectedOwners((prev) => prev.filter((id) => id !== ownerId));
    }
  };

  const handleSaveOwner = (data: OwnerFormSave) => {
    const { owner, unit } = ownerFromFormSave(
      portfolio,
      data,
      editingOwner?.owner,
    );
    upsertOwner(owner, unit);
    setIsOwnerModalOpen(false);
    setEditingOwner(null);
  };

  const handleOwnerSelect = (ownerId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOwners((prev) => [...prev, ownerId]);
    } else {
      setSelectedOwners((prev) => prev.filter((id) => id !== ownerId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOwners(filteredOwners.map((row) => row.owner.id));
    } else {
      setSelectedOwners([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20">
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
                onClick={handleAddOwner}
                className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
              >
                <Icon name="Plus" size={20} />
                <span>{t("addOwner")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <OwnerStatistics owners={ownersWithBalances} />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <OwnerFilters
                filters={filters}
                onFiltersChange={setFilters}
                properties={portfolioProperties}
              />

              {selectedOwners.length > 0 && (
                <BulkOperations
                  selectedCount={selectedOwners.length}
                  onClearSelection={() => setSelectedOwners([])}
                />
              )}

              <OwnerTable
                owners={filteredOwners}
                selectedOwners={selectedOwners}
                onOwnerSelect={handleOwnerSelect}
                onSelectAll={handleSelectAll}
                onEditOwner={handleEditOwner}
                onDeleteOwner={handleDeleteOwner}
              />
            </div>
          </div>
        </div>
      </div>

      {isOwnerModalOpen && (
        <OwnerModal
          owner={editingOwner}
          properties={portfolioProperties}
          onClose={() => setIsOwnerModalOpen(false)}
          onSave={handleSaveOwner}
        />
      )}
    </div>
  );
}

export default OwnersManagement;
