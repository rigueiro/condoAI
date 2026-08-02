"use client";

import React, { useMemo, useState } from "react";
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
import {
  useCollections,
  useReminderCopy,
  type PaymentRow,
  type RecordPaymentInput,
} from "@/lib/collections";
import { usePortfolio } from "@/lib/portfolio";
import { buildCollectionFromProperties } from "@/fixtures/views";

interface Filters {
  dateRange: { start: string; end: string };
  property: string;
  status: string;
  amountRange: { min: string; max: string };
  searchTerm: string;
}

function PaymentTracking() {
  const t = useTranslations("paymentTracking");
  const tDash = useTranslations("dashboard.upcomingPayments");
  const { properties } = usePortfolio();
  const reminderCopy = useReminderCopy();
  const {
    payments: paymentHistory,
    recordPayment,
    sendReminders,
  } = useCollections();

  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] =
    useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    dateRange: { start: "", end: "" },
    property: "",
    status: "",
    amountRange: { min: "", max: "" },
    searchTerm: "",
  });

  const collectionData = useMemo(
    () => buildCollectionFromProperties(properties),
    [properties],
  );

  const handleRecordPayment = (paymentData: RecordPaymentInput) => {
    const result = recordPayment(paymentData);
    setFlash(
      result
        ? tDash("paymentRecorded", { name: paymentData.ownerName })
        : tDash("paymentRecordedGeneric"),
    );
    setIsRecordPaymentModalOpen(false);
  };

  const handleBulkImport = (importData: unknown) => {
    console.log("Bulk import data:", importData);
    setIsBulkImportModalOpen(false);
  };

  const handlePaymentSelect = (paymentId: number, isSelected: boolean) => {
    setSelectedPayments((prev) =>
      isSelected ? [...prev, paymentId] : prev.filter((id) => id !== paymentId),
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedPayments(
      isSelected ? paymentHistory.map((payment) => payment.id) : [],
    );
  };

  const handleSendReminder = (payment: PaymentRow) => {
    if (payment.quotaStatus !== "overdue" && payment.quotaStatus !== "pending") {
      setFlash(tDash("reminderNoEmail"));
      return;
    }
    const result = sendReminders([payment.quotaId], reminderCopy);
    setFlash(
      result.sent ? tDash("reminderSentOne") : tDash("reminderNoEmail"),
    );
  };

  const filteredPayments = paymentHistory.filter((payment) => {
    const matchesProperty =
      !filters.property ||
      payment.property.toLowerCase().includes(filters.property.toLowerCase());
    const matchesStatus = !filters.status || payment.status === filters.status;
    const term = filters.searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      payment.ownerName.toLowerCase().includes(term) ||
      payment.property.toLowerCase().includes(term) ||
      payment.unit.toLowerCase().includes(term);
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
      <Header />

      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

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
                onClick={() => console.log("Exporting payment report...")}
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

          {flash && (
            <div className="mb-6 p-3 rounded-lg bg-success-50 border border-success-100 text-sm text-success">
              {flash}
            </div>
          )}

          <CollectionSummary collectionData={collectionData} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
            <div className="xl:col-span-8 space-y-6">
              <PaymentFilters
                filters={filters}
                onFiltersChange={setFilters}
                paymentHistory={paymentHistory}
              />

              <PaymentHistoryTable
                payments={filteredPayments}
                selectedPayments={selectedPayments}
                onPaymentSelect={handlePaymentSelect}
                onSelectAll={handleSelectAll}
                onViewReceipt={(payment) =>
                  console.log("Viewing receipt for payment:", payment.receiptNumber)
                }
                onSendReminder={handleSendReminder}
                onMarkDisputed={(payment) =>
                  console.log("Mark disputed:", payment.quotaId)
                }
              />
            </div>

            <div className="xl:col-span-4">
              <CollectionAnalytics
                collectionData={collectionData}
                paymentHistory={paymentHistory}
              />
            </div>
          </div>
        </div>

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
