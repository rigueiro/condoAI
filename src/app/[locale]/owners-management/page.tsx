"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import BreadcrumbNavigation from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";

import OwnerModal from "./components/owner-modal";
import OwnerStatistics from "./components/owner-statistics";
import OwnerFilters from "./components/owner-filters";
import OwnerTable from "./components/owner-table";
import BulkOperations from "./components/bulk-operations";
import { Owner, PaymentStatus } from "./components/types";
import { mockOwners } from "./__fixtures__/mock-owners";
import { mockProperties } from "./__fixtures__/mock-properties";

import useSWR from "swr";
import { fetcher } from "@/app/mocks/mocks-utils";

interface Filters {
  search: string;
  property: string;
  paymentStatus: PaymentStatus;
  balanceRange: string;
}

function OwnersManagement() {
  const t = useTranslations("ownersManagement");
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    property: "",
    paymentStatus: "",
    balanceRange: "",
  });

  // const { data, error } = useSWR("/api/owners", fetcher);

  // Filter owners based on current filters
  const filteredOwners = useMemo(() => {
    return mockOwners.filter((owner) => {
      const matchesSearch =
        !filters.search ||
        owner.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        owner.unit.toLowerCase().includes(filters.search.toLowerCase()) ||
        owner.email.toLowerCase().includes(filters.search.toLowerCase());

      const matchesProperty =
        !filters.property || owner.property === filters.property;

      const matchesPaymentStatus =
        !filters.paymentStatus || owner.paymentStatus === filters.paymentStatus;

      const matchesBalanceRange =
        !filters.balanceRange ||
        (() => {
          switch (filters.balanceRange) {
            case "zero":
              return owner.currentBalance === 0;
            case "low":
              return owner.currentBalance > 0 && owner.currentBalance <= 1000;
            case "medium":
              return (
                owner.currentBalance > 1000 && owner.currentBalance <= 3000
              );
            case "high":
              return owner.currentBalance > 3000;
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
  }, [filters]);

  const handleAddOwner = () => {
    setEditingOwner(null);
    setIsOwnerModalOpen(true);
  };

  const handleEditOwner = (owner: Owner) => {
    setEditingOwner(owner);
    setIsOwnerModalOpen(true);
  };

  const handleDeleteOwner = (ownerId: string) => {
    if (
      window.confirm(t("confirmDeleteUndone"))
    ) {
      console.log("Deleting owner:", ownerId);
      // In real app, this would call an API to delete the owner
    }
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
      setSelectedOwners(filteredOwners.map((owner) => owner.id));
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
                onClick={handleAddOwner}
                className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-smooth"
              >
                <Icon name="Plus" size={20} />
                <span>{t("addOwner")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Statistics */}
            <div className="lg:col-span-1">
              <OwnerStatistics owners={mockOwners} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filters */}
              <OwnerFilters
                filters={filters}
                onFiltersChange={setFilters}
                properties={mockProperties}
              />

              {/* Bulk Operations */}
              {selectedOwners.length > 0 && (
                <BulkOperations
                  selectedCount={selectedOwners.length}
                  onClearSelection={() => setSelectedOwners([])}
                />
              )}

              {/* Owners Table */}
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

      {/* Owner Modal */}
      {isOwnerModalOpen && (
        <OwnerModal
          owner={editingOwner}
          properties={mockProperties}
          onClose={() => setIsOwnerModalOpen(false)}
          onSave={(ownerData) => {
            console.log("Saving owner:", ownerData);
            setIsOwnerModalOpen(false);
            // In real app, this would call an API to save the owner
          }}
        />
      )}
    </div>
  );
}

export default OwnersManagement;
