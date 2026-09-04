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
import RecordPaymentModal from "@/app/[locale]/payment-tracking/components/record-payment-modal";
import OwnerModal, { type OwnerFormSave } from "../components/owner-modal";
import CurrentAccountExtract from "../components/current-account-extract";
import ChargeModal from "../components/charge-modal";
import ReceiptModal from "../components/receipt-modal";
import DebtCertificateModal from "../components/debt-certificate-modal";
import TransferModal from "../components/transfer-modal";
import AgreementModal from "../components/agreement-modal";
import AgreementPanel from "../components/agreement-panel";
import Toast, { type ToastTone } from "@/components/ui/toast";
import type { TransferInput } from "@/lib/portfolio/transfer";
import {
  paymentStatusLabel,
  paymentStatusStyle,
  type PaymentStatus,
} from "../components/types";
import { ownerFromFormSave, usePortfolio } from "@/lib/portfolio";
import {
  AGREEMENT_ERROR_CODES,
  useCollections,
  type AccountReceipt,
  type AddChargeInput,
  type CreateAgreementInput,
  type RecordPaymentInput,
  visibleAgreementForOwner,
} from "@/lib/collections";

const ACTION_CLASS =
  "w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth";

function OwnerDetailPage() {
  const t = useTranslations("ownersManagement.detail");
  const tTransfer = useTranslations("ownersManagement.transfer");
  const tAgreement = useTranslations("ownersManagement.agreement");
  const tStatus = useTranslations("ownersManagement.status");
  const tRole = useTranslations("ownersManagement.roles");
  const { formatCurrency } = useFormatCurrency();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const { portfolio, upsertOwner } = usePortfolio();
  const {
    ownersWithBalances,
    recordPayment,
    addCharge,
    issueCertificate,
    transferOwnership,
    agreements,
    createPaymentAgreement,
    payAgreementInstallment,
    defaultPaymentAgreement,
    cancelPaymentAgreement,
    extractForOwner,
    receipts,
    quotas,
    charges,
  } = useCollections();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [flash, setFlash] = useState<{ message: string; tone: ToastTone } | null>(
    null,
  );
  const [viewingReceipt, setViewingReceipt] = useState<AccountReceipt | null>(
    null,
  );

  const row = useMemo(
    () =>
      id ? ownersWithBalances.find((o) => o.owner.id === id) : undefined,
    [id, ownersWithBalances],
  );

  const extract = useMemo(
    () => (row ? extractForOwner(row.owner.id) : []),
    [row, extractForOwner],
  );

  const properties = portfolio.condominiums.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = paymentStatusStyle(status);
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
      >
        {tStatus(paymentStatusLabel(status))}
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
    const result = await recordPayment(paymentData);
    setIsRecordPaymentOpen(false);
    if (result?.receipt) setViewingReceipt(result.receipt);
  };

  const handleAddCharge = (input: AddChargeInput) => addCharge(input);

  const handleTransfer = async (input: TransferInput) => {
    const result = await transferOwnership(input);
    if (result.ok) {
      setFlash({
        message: result.result.certificateNumber
          ? tTransfer("doneWithCertificate", {
              certificate: result.result.certificateNumber,
            })
          : tTransfer("done"),
        tone: "success",
      });
      return true;
    }
    setFlash({ message: tTransfer("failed"), tone: "warning" });
    return false;
  };

  const handleCreateAgreement = async (input: CreateAgreementInput) => {
    const result = await createPaymentAgreement(input);
    if (result.ok) {
      setFlash({
        message: tAgreement("created", { number: result.agreement.number }),
        tone: "success",
      });
      return true;
    }
    setFlash({
      message: AGREEMENT_ERROR_CODES.has(result.code)
        ? tAgreement(`errors.${result.code}`)
        : tAgreement("failed"),
      tone: "warning",
    });
    return false;
  };

  if (!id || !row) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
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
  const shownAgreement = visibleAgreementForOwner(agreements, owner.id);
  const canCreateAgreement =
    shownAgreement?.status !== "active" && row.currentBalance > 0;

  const handlePayInstallment = async (
    input: RecordPaymentInput & { installmentId: string },
  ) => {
    if (!shownAgreement) return false;
    const result = await payAgreementInstallment({
      agreementId: shownAgreement.id,
      installmentId: input.installmentId,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    });
    if (result.ok) {
      if (result.receipt) setViewingReceipt(result.receipt);
      setFlash({ message: tAgreement("installmentPaid"), tone: "success" });
      return true;
    }
    setFlash({ message: tAgreement("payFailed"), tone: "warning" });
    return false;
  };

  const handleDefaultAgreement = async () => {
    if (!shownAgreement) return false;
    const result = await defaultPaymentAgreement(shownAgreement.id);
    setFlash({
      message: result.ok ? tAgreement("defaulted") : tAgreement("failed"),
      tone: result.ok ? "success" : "warning",
    });
    return result.ok;
  };

  const handleCancelAgreement = async () => {
    if (!shownAgreement) return false;
    const result = await cancelPaymentAgreement(shownAgreement.id);
    setFlash({
      message: result.ok
        ? tAgreement("cancelled")
        : result.code === "hasPayments"
          ? tAgreement("errors.hasPayments")
          : tAgreement("failed"),
      tone: result.ok ? "success" : "warning",
    });
    return result.ok;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="print-chrome">
        <Header />
      </div>

      <main className="print:pt-0">
        <div className="max-w-7xl mx-auto px-6 py-8 print:max-w-none print:px-0 print:py-0">
          <div className="print-chrome">
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 print:block">
            <div className="xl:col-span-2 space-y-8 print:space-y-0">
              <section className="bg-surface rounded-lg border border-border-light p-6 print-chrome">
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

              {shownAgreement && (
                <AgreementPanel
                  agreement={shownAgreement}
                  ownerId={owner.id}
                  onPay={handlePayInstallment}
                  onDefault={handleDefaultAgreement}
                  onCancel={handleCancelAgreement}
                  onIssueCertificate={() => setIsCertificateOpen(true)}
                />
              )}

              <CurrentAccountExtract
                movements={extract}
                ownerName={owner.fullName}
                unitLabel={row.unitLabel}
                condominiumName={row.condominiumName}
                onReceiptClick={(receiptId) => {
                  const receipt = receipts.find((item) => item.id === receiptId);
                  if (receipt) setViewingReceipt(receipt);
                }}
              />
            </div>

            <div className="xl:col-span-1 space-y-6 print-chrome">
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

              <div className="bg-surface rounded-lg border border-border-light p-6 sticky top-32">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("quickActions")}
                </h3>
                <div className="space-y-2">
                  {(
                    [
                      {
                        icon: "CreditCard",
                        label: t("recordPayment"),
                        onClick: () => setIsRecordPaymentOpen(true),
                      },
                      ...(canCreateAgreement
                        ? [
                            {
                              icon: "Handshake",
                              label: t("paymentAgreement"),
                              onClick: () => setIsAgreementOpen(true),
                            },
                          ]
                        : []),
                      {
                        icon: "PlusCircle",
                        label: t("addCharge"),
                        onClick: () => setIsChargeOpen(true),
                      },
                      {
                        icon: "ScrollText",
                        label: t("issueCertificate"),
                        onClick: () => setIsCertificateOpen(true),
                      },
                      {
                        icon: "ArrowRightLeft",
                        label: t("transfer"),
                        onClick: () => setIsTransferOpen(true),
                      },
                      {
                        icon: "Printer",
                        label: t("printExtract"),
                        onClick: () => window.print(),
                      },
                      {
                        icon: "Edit2",
                        label: t("editOwner"),
                        onClick: () => setIsEditModalOpen(true),
                      },
                    ] as const
                  ).map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={ACTION_CLASS}
                    >
                      <Icon
                        name={action.icon}
                        size={16}
                        className="mr-2 shrink-0"
                      />
                      {action.label}
                    </button>
                  ))}
                  <Link
                    href={`/properties-management/${row.condominiumId}`}
                    className={ACTION_CLASS}
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
                    className={ACTION_CLASS}
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

      <ChargeModal
        isOpen={isChargeOpen}
        ownerId={owner.id}
        condominiumId={row.condominiumId}
        onClose={() => setIsChargeOpen(false)}
        onSubmit={handleAddCharge}
      />

      <DebtCertificateModal
        isOpen={isCertificateOpen}
        ownerId={owner.id}
        ownerName={owner.fullName}
        quotas={quotas}
        charges={charges}
        receipts={receipts}
        onClose={() => setIsCertificateOpen(false)}
        onIssue={(asOfDate) =>
          issueCertificate({
            ownerId: owner.id,
            condominiumId: row.condominiumId,
            asOfDate,
          })
        }
      />

      {isTransferOpen && (
        <TransferModal
          seller={row}
          owners={portfolio.owners}
          units={portfolio.units}
          quotas={quotas}
          charges={charges}
          receipts={receipts}
          onClose={() => setIsTransferOpen(false)}
          onTransfer={handleTransfer}
        />
      )}

      {isAgreementOpen && (
        <AgreementModal
          ownerId={owner.id}
          condominiumId={row.condominiumId}
          quotas={quotas}
          charges={charges}
          receipts={receipts}
          onClose={() => setIsAgreementOpen(false)}
          onCreate={handleCreateAgreement}
        />
      )}

      <ReceiptModal
        receipt={viewingReceipt}
        ownerName={owner.fullName}
        property={row.condominiumName}
        unit={row.unitLabel}
        onClose={() => setViewingReceipt(null)}
      />

      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={() => setFlash(null)}
        />
      )}
    </div>
  );
}

export default OwnerDetailPage;
