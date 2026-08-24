"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import Image from "@/components/image";
import PaymentHistoryTable from "@/app/[locale]/payment-tracking/components/payment-history-table";
import RecordPaymentModal from "@/app/[locale]/payment-tracking/components/record-payment-modal";
import OwnerModal, { type OwnerFormSave } from "../components/owner-modal";
import type { PaymentStatus } from "../components/types";
import { ownerFromFormSave, usePortfolio } from "@/lib/portfolio";
import { useCollections, type RecordPaymentInput } from "@/lib/collections";

function OwnerDetailPage() {
  const t = useTranslations("ownersManagement.detail");
  const tStatus = useTranslations("ownersManagement.status");
  const tRole = useTranslations("ownersManagement.roles");
  const { formatCurrency } = useFormatCurrency();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const { portfolio, upsertOwner } = usePortfolio();
  const { ownersWithBalances, payments, recordPayment } = useCollections();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const row = useMemo(
    () =>
      id
        ? ownersWithBalances.find((o) => o.owner.id === id)
        : undefined,
    [id, ownersWithBalances],
  );

  const ownerPayments = useMemo(() => {
    if (!row) return [];
    return payments.filter((p) => p.ownerId === row.owner.id);
  }, [row, payments]);

  const properties = portfolio.condominiums.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      current: { color: "text-success", bg: "bg-success-100" },
      pending: { color: "text-warning", bg: "bg-warning-100" },
      overdue: { color: "text-error", bg: "bg-error-100" },
    } as Record<PaymentStatus, { color: string; bg: string }>;

    const config = statusConfig[status] || statusConfig.current;
    const label = status
      ? tStatus(status as "current" | "pending" | "overdue")
      : tStatus("current");

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
      >
        {label}
      </span>
    );
  };

  const handleSaveOwner = (data: OwnerFormSave) => {
    if (!row) return;
    const { owner, occupancies } = ownerFromFormSave(data, row.owner);
    upsertOwner(owner, occupancies);
    setIsEditModalOpen(false);
  };

  const handleRecordPayment = async (paymentData: RecordPaymentInput) => {
    await recordPayment(paymentData);
    setIsRecordPaymentOpen(false);
  };

  if (!id || !row) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Breadcrumb />
            <div className="bg-surface rounded-lg border border-border-light p-8 text-center">
              <Icon
                name="UserX"
                size={48}
                className="text-secondary-300 mx-auto mb-4"
              />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {t("notFound")}
              </h2>
              <p className="text-text-secondary mb-4">{t("notFoundDesc")}</p>
              <Link
                href="/owners-management"
                className="inline-flex items-center space-x-2 text-primary hover:underline"
              >
                <Icon name="ArrowLeft" size={16} />
                <span>{t("backToList")}</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { owner } = row;
  const balanceIsClear = row.currentBalance === 0;
  const joinDate = String(owner.entryDate).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary-100 shrink-0">
                <Image
                  src={row.avatar || ""}
                  alt={owner.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-text-primary">
                    {owner.fullName}
                  </h1>
                  {getPaymentStatusBadge(row.paymentStatus)}
                </div>
                <p className="text-text-secondary">
                  {row.occupancies.length > 0
                    ? t("unitProperty", {
                        unit: row.unitLabel,
                        property: row.condominiumName,
                      })
                    : t("noFractions")}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {owner.contacts.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="bg-surface rounded-lg border border-border-light p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  {t("balanceStatus")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div
                    className={`rounded-lg p-4 ${balanceIsClear ? "bg-success-50" : "bg-error-50"}`}
                  >
                    <p className="text-sm text-text-secondary mb-1">
                      {t("currentBalance")}
                    </p>
                    <p
                      className={`text-2xl font-bold ${balanceIsClear ? "text-success" : "text-error"}`}
                    >
                      {formatCurrency(row.currentBalance)}
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-secondary-50">
                    <p className="text-sm text-text-secondary mb-1">
                      {t("paymentStatus")}
                    </p>
                    <div className="mt-1">
                      {getPaymentStatusBadge(row.paymentStatus)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-secondary-50">
                    <p className="text-sm text-text-secondary mb-1">
                      {t("lastPayment")}
                    </p>
                    <p className="text-lg font-semibold text-text-primary">
                      {row.lastPayment || "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {t("paymentHistory")}
                </h2>
                <PaymentHistoryTable
                  payments={ownerPayments}
                  selectedPayments={[]}
                  onPaymentSelect={() => {}}
                  onSelectAll={() => {}}
                  onViewReceipt={() => {}}
                  onSendReminder={() => {}}
                  onMarkDisputed={() => {}}
                />
              </section>
            </div>

            <div className="xl:col-span-1 space-y-6">
              <div className="bg-surface rounded-lg border border-border-light p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("ownerInfo")}
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-text-secondary">{t("email")}</dt>
                    <dd className="font-medium text-text-primary break-all">
                      {owner.contacts.email}
                    </dd>
                  </div>
                  {owner.contacts.phone && (
                    <div>
                      <dt className="text-text-secondary">{t("phone")}</dt>
                      <dd className="font-medium text-text-primary">
                        {owner.contacts.phone}
                      </dd>
                    </div>
                  )}
                  {owner.taxId && (
                    <div>
                      <dt className="text-text-secondary">{t("taxId")}</dt>
                      <dd className="font-medium text-text-primary">
                        {owner.taxId}
                      </dd>
                    </div>
                  )}
                  {owner.contacts.mailingAddress && (
                    <div>
                      <dt className="text-text-secondary">
                        {t("emergencyContact")}
                      </dt>
                      <dd className="font-medium text-text-primary">
                        {owner.contacts.mailingAddress}
                      </dd>
                    </div>
                  )}
                  {row.occupancies.length > 0 ? (
                    row.occupancies.map((item) => (
                      <div key={`${item.unitId}-${item.role}`}>
                        <dt className="text-text-secondary">
                          {item.unitLabel}
                          {item.role !== "owner"
                            ? ` · ${tRole(item.role)}`
                            : ""}
                        </dt>
                        <dd>
                          <Link
                            href={`/properties-management/${item.condominiumId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.condominiumName}
                          </Link>
                        </dd>
                      </div>
                    ))
                  ) : (
                    <div>
                      <dt className="text-text-secondary">{t("unit")}</dt>
                      <dd className="font-medium text-text-primary">—</dd>
                    </div>
                  )}
                  {row.unitPermillage > 0 && (
                    <div>
                      <dt className="text-text-secondary">{t("permillage")}</dt>
                      <dd className="font-medium text-text-primary">
                        {row.unitPermillage}‰
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-secondary">{t("joinDate")}</dt>
                    <dd className="font-medium text-text-primary">
                      {joinDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("monthlyFee")}</dt>
                    <dd className="font-medium text-text-primary">
                      {formatCurrency(owner.monthlyQuota)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-surface rounded-lg border border-border-light p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("quickActions")}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon
                      name="CreditCard"
                      size={16}
                      className="mr-2 shrink-0"
                    />
                    {t("recordPayment")}
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="Edit2" size={16} className="mr-2 shrink-0" />
                    {t("editOwner")}
                  </button>
                  <Link
                    href={`/properties-management/${row.condominiumId}`}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon
                      name="Building2"
                      size={16}
                      className="mr-2 shrink-0"
                    />
                    {t("viewProperty")}
                  </Link>
                  <Link
                    href="/payment-tracking"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="Receipt" size={16} className="mr-2 shrink-0" />
                    {t("allPayments")}
                  </Link>
                </div>
                <Link
                  href="/owners-management"
                  className="mt-6 inline-flex items-center space-x-2 text-primary hover:underline text-sm font-medium"
                >
                  <Icon name="ArrowLeft" size={16} />
                  <span>{t("backToList")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <OwnerModal
          owner={row}
          properties={properties}
          units={portfolio.units}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveOwner}
        />
      )}

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSubmit={handleRecordPayment}
        initialValues={{
          ownerId: owner.id,
          amount: row.currentBalance > 0 ? row.currentBalance : owner.monthlyQuota,
        }}
      />
    </div>
  );
}

export default OwnerDetailPage;
