"use client";

import React, { useCallback, useMemo, useState } from "react";
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
import Toast, { type ToastTone } from "@/components/ui/toast";
import {
  useCollections,
  useReminderCopy,
  type AccountReceipt,
  type PaymentRow,
  type RecordPaymentInput,
} from "@/lib/collections";
import {
  buildCollectionFromPortfolio,
  usePortfolio,
} from "@/lib/portfolio";
import { buildMockCollectionSummary } from "@/fixtures/views";
import ReceiptModal from "@/app/[locale]/owners-management/components/receipt-modal";

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
  const tReceipt = useTranslations("currentAccount.receipt");
  const { portfolio, isDemo } = usePortfolio();
  const reminderCopy = useReminderCopy();
  const {
    payments: paymentHistory,
    quotas,
    recordPayment,
    sendReminders,
    receiptForQuota,
  } = useCollections();

  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] =
    useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<AccountReceipt | null>(
    null,
  );
  const [flash, setFlash] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);
  const dismissFlash = useCallback(() => setFlash(null), []);
  const [filters, setFilters] = useState<Filters>({
    dateRange: { start: "", end: "" },
    property: "",
    status: "",
    amountRange: { min: "", max: "" },
    searchTerm: "",
  });

  const receiptParty = useMemo(() => {
    if (!viewingReceipt) return { ownerName: "", property: undefined, unit: undefined };
    const row = paymentHistory.find((p) => p.quotaId === viewingReceipt.quotaId);
    return {
      ownerName:
        row?.ownerName ??
        portfolio.owners.find((o) => o.id === viewingReceipt.ownerId)?.fullName ??
        "",
      property: row?.property,
      unit: row?.unit,
    };
  }, [viewingReceipt, paymentHistory, portfolio.owners]);

  const collectionData = useMemo(() => {
    return isDemo
      ? buildMockCollectionSummary()
      : buildCollectionFromPortfolio(portfolio, quotas);
  }, [isDemo, portfolio, quotas]);

  const handleRecordPayment = async (paymentData: RecordPaymentInput) => {
    const result = await recordPayment(paymentData);
    const ownerName =
      paymentHistory.find((p) => p.ownerId === paymentData.ownerId)
        ?.ownerName ??
      portfolio.owners.find((o) => o.id === paymentData.ownerId)?.fullName ??
      paymentData.ownerId;
    setFlash({
      message: result
        ? tDash("paymentRecorded", { name: ownerName })
        : tDash("paymentRecordedGeneric"),
      tone: "success",
    });
    setIsRecordPaymentModalOpen(false);
    if (result?.receipt) setViewingReceipt(result.receipt);
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
      isSelected ? filteredPayments.map((payment) => payment.id) : [],
    );
  };

  const handleSendReminder = (payment: PaymentRow) => {
    if (payment.quotaStatus !== "overdue" && payment.quotaStatus !== "pending") {
      setFlash({ message: tDash("reminderNoContact"), tone: "warning" });
      return;
    }
    const result = sendReminders([payment.quotaId], reminderCopy);
    if (!result.sent) {
      setFlash({
        message:
          result.reason === "already-contacted"
            ? tDash("alreadyContacted")
            : tDash("reminderNoContact"),
        tone: "warning",
      });
      return;
    }
    const channel =
      result.channel === "sms" ? tDash("channel.sms") : tDash("channel.email");
    setFlash({
      message: tDash("reminderSentOne", { channel }),
      tone: "success",
    });
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

      <main className="px-6 pb-8">
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

          <CollectionSummary collectionData={collectionData} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
            <div className="xl:col-span-8 space-y-6">
              <PaymentFilters
                filters={filters}
                onFiltersChange={setFilters}
              />

              <PaymentHistoryTable
                payments={filteredPayments}
                selectedPayments={selectedPayments}
                onPaymentSelect={handlePaymentSelect}
                onSelectAll={handleSelectAll}
                onViewReceipt={(payment) => {
                  const receipt = receiptForQuota(payment.quotaId);
                  if (!receipt) {
                    setFlash({
                      message: tReceipt("notIssued"),
                      tone: "warning",
                    });
                    return;
                  }
                  setViewingReceipt(receipt);
                }}
                onSendReminder={handleSendReminder}
                onMarkDisputed={(payment) =>
                  console.log("Mark disputed:", payment.quotaId)
                }
              />
            </div>

            <div className="xl:col-span-4">
              <CollectionAnalytics
                collectionData={collectionData}
                paymentHistory={filteredPayments}
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

        <ReceiptModal
          receipt={viewingReceipt}
          ownerName={receiptParty.ownerName}
          property={receiptParty.property}
          unit={receiptParty.unit}
          onClose={() => setViewingReceipt(null)}
        />

        {flash && (
          <Toast
            message={flash.message}
            tone={flash.tone}
            onDismiss={dismissFlash}
          />
        )}
      </main>
    </div>
  );
}

export default PaymentTracking;
