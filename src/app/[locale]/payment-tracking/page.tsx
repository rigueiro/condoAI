"use client";

// src/pages/payment-tracking/index.jsx
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import CollectionSummary from "./components/collection-summary";
import PaymentHistoryTable from "./components/payment-history-table";
import PaymentFilters from "./components/payment-filters";
import RecordPaymentModal from "./components/record-payment-modal";
import BulkImportModal from "./components/bulk-import-modal";
import CollectionAnalytics from "./components/collection-analytics";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";

import useSWR from "swr";
import { fetcher } from "@/app/mocks/mocks-utils";
import { handlers } from "@/app/mocks/handlers";
import { mockPayments } from "./__fixtures__/mock-payments";

type Payment = (typeof mockPayments)[number];

interface Filters {
  dateRange: { start: string; end: string };
  property: string;
  status: string;
  amountRange: { min: string; max: string };
  searchTerm: string;
}

function PaymentTracking() {
  const t = useTranslations("paymentTracking");
  const [currentUser] = useState({
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@condomanager.com",
    role: "Property Manager",
    avatar: null,
  });

  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] =
    useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [filters, setFilters] = useState<Filters>({
    dateRange: { start: "", end: "" },
    property: "",
    status: "",
    amountRange: { min: "", max: "" },
    searchTerm: "",
  });

  // TODO const { data, error } = useSWR('/api/payment', handlers)

  // Mock data for payment collections
  const collectionData = {
    currentMonth: {
      totalTarget: 500000,
      totalCollected: 462500,
      collectionRate: 92.5,
      outstandingBalance: 37500,
      totalProperties: 24,
    },
    propertyBreakdown: [
      {
        id: 1,
        name: "Oceanview Towers",
        unitsCount: 48,
        collected: 120000,
        target: 130000,
        collectionRate: 92.3,
        outstanding: 10000,
      },
      {
        id: 2,
        name: "Marina Heights",
        unitsCount: 36,
        collected: 86400,
        target: 90000,
        collectionRate: 96.0,
        outstanding: 3600,
      },
      {
        id: 3,
        name: "Sunset Gardens",
        unitsCount: 24,
        collected: 57600,
        target: 60000,
        collectionRate: 96.0,
        outstanding: 2400,
      },
      {
        id: 4,
        name: "Parkview Complex",
        unitsCount: 32,
        collected: 76800,
        target: 80000,
        collectionRate: 96.0,
        outstanding: 3200,
      },
      {
        id: 5,
        name: "City Center Condos",
        unitsCount: 40,
        collected: 96000,
        target: 100000,
        collectionRate: 96.0,
        outstanding: 4000,
      },
      {
        id: 6,
        name: "Riverside Plaza",
        unitsCount: 28,
        collected: 25700,
        target: 40000,
        collectionRate: 64.3,
        outstanding: 14300,
      },
    ],
  };

  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([...mockPayments]);

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleRecordPayment = (paymentData: Payment) => {
    const newPayment: Payment = {
      id: paymentHistory.length + 1,
      date: new Date().toISOString().split("T")[0],
      ownerName: paymentData.ownerName,
      property: paymentData.property,
      ...(paymentData.propertyId != null && { propertyId: paymentData.propertyId }),
      unit: paymentData.unit,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      status: "completed",
      receiptNumber: `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      timestamp: new Date().toISOString(),
    };

    setPaymentHistory([newPayment, ...paymentHistory]);
    setIsRecordPaymentModalOpen(false);
  };

  const handleBulkImport = (importData: unknown) => {
    console.log("Bulk import data:", importData);
    setIsBulkImportModalOpen(false);
  };

  const handlePaymentSelect = (paymentId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPayments([...selectedPayments, paymentId]);
    } else {
      setSelectedPayments(selectedPayments.filter((id) => id !== paymentId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedPayments(paymentHistory.map((payment) => payment.id));
    } else {
      setSelectedPayments([]);
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleExportReport = () => {
    console.log("Exporting payment report...");
  };

  const handleViewReceipt = (payment: Payment) => {
    console.log("Viewing receipt for payment:", payment.receiptNumber);
  };

  const handleSendReminder = (payment: Payment) => {
    console.log("Sending reminder for payment:", payment.id);
  };

  const handleMarkDisputed = (payment: Payment) => {
    const updatedHistory = paymentHistory.map((p) =>
      p.id === payment.id ? { ...p, status: "disputed" as const } : p,
    );
    setPaymentHistory(updatedHistory);
  };

  const filteredPayments = paymentHistory.filter((payment) => {
    const matchesProperty =
      !filters.property ||
      payment.property.toLowerCase().includes(filters.property.toLowerCase());
    const matchesStatus = !filters.status || payment.status === filters.status;
    const matchesSearch =
      !filters.searchTerm ||
      payment.ownerName
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      payment.property
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      payment.unit.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesDateRange =
      (!filters.dateRange.start || payment.date >= filters.dateRange.start) &&
      (!filters.dateRange.end || payment.date <= filters.dateRange.end);

    const matchesAmountRange =
      (!filters.amountRange.min ||
        payment.amount >= parseFloat(filters.amountRange.min)) &&
      (!filters.amountRange.max ||
        payment.amount <= parseFloat(filters.amountRange.max));

    return (
      matchesProperty &&
      matchesStatus &&
      matchesSearch &&
      matchesDateRange &&
      matchesAmountRange
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <main className="pt-20 px-6 pb-8">
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
            <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                iconName="Upload"
                onClick={() => setIsBulkImportModalOpen(true)}
                className="w-full sm:w-auto"
              >
                {t("bulkImport")}
              </Button>
              <Button
                variant="outline"
                iconName="Download"
                onClick={handleExportReport}
                className="w-full sm:w-auto"
              >
                {t("exportReport")}
              </Button>
              <Button
                iconName="Plus"
                onClick={() => setIsRecordPaymentModalOpen(true)}
                className="w-full sm:w-auto text-white"
              >
                {t("recordPayment")}
              </Button>
            </div>
          </div>

          {/* Collection Summary */}
          <CollectionSummary collectionData={collectionData} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
            {/* Left Panel - Payment History */}
            <div className="xl:col-span-8 space-y-6">
              {/* Filters */}
              <PaymentFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                paymentHistory={paymentHistory}
              />

              {/* Payment History Table */}
              <PaymentHistoryTable
                payments={filteredPayments}
                selectedPayments={selectedPayments}
                onPaymentSelect={handlePaymentSelect}
                onSelectAll={handleSelectAll}
                onViewReceipt={handleViewReceipt}
                onSendReminder={handleSendReminder}
                onMarkDisputed={handleMarkDisputed}
              />
            </div>

            {/* Right Panel - Analytics */}
            <div className="xl:col-span-4">
              <CollectionAnalytics
                collectionData={collectionData}
                paymentHistory={paymentHistory}
              />
            </div>
          </div>
        </div>
        {/* Modals */}
        <RecordPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => setIsRecordPaymentModalOpen(false)}
          onSubmit={handleRecordPayment}
        />

        <BulkImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          onSubmit={handleBulkImport}
        />
      </main>
    </div>
  );
}

export default PaymentTracking;
