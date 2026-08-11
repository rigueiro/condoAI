"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import CollectionSummary from "@/app/[locale]/payment-tracking/components/collection-summary";
import PaymentHistoryTable from "@/app/[locale]/payment-tracking/components/payment-history-table";
import RecordPaymentModal from "@/app/[locale]/payment-tracking/components/record-payment-modal";
import PropertyModal from "../components/property-modal";
import PropertyDetailStats from "../components/property-detail-stats";
import PropertyOwnersList from "../components/property-owners-list";
import { mockOccurrences } from "@/app/[locale]/occurrences/__fixtures__/mock-occurrences";
import { formatOccurrenceDate } from "@/app/[locale]/occurrences/types";
import type { Condominium } from "@/types";
import { useCollections } from "@/lib/collections";
import {
  buildingTypeI18nKey,
  collectionSummaryForCondo,
  condominiumStatusI18nKey,
  condoStats,
  formatPortugueseAddress,
  labelCommonAreas,
  usePortfolio,
} from "@/lib/portfolio";
import { mockCondoStats } from "@/fixtures/views";

function PropertyDetailPage() {
  const t = useTranslations("propertiesManagement.detail");
  const tModal = useTranslations("propertiesManagement.modal");
  const tOccCategory = useTranslations("occurrences.categories");
  const tOccState = useTranslations("occurrences.states");
  const tOccPriority = useTranslations("occurrences.priorities");
  const { formatPriceString } = useFormatCurrency();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const { portfolio, isDemo, upsertCondominium } = usePortfolio();
  const { quotas, payments, recordPayment, ownersWithBalances } =
    useCollections();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const condo = useMemo(
    () =>
      id
        ? portfolio.condominiums.find((c) => c.id === id)
        : undefined,
    [id, portfolio.condominiums],
  );

  const stats = useMemo(() => {
    if (!condo) return null;
    return isDemo
      ? mockCondoStats(condo)
      : condoStats(condo, portfolio, quotas);
  }, [condo, isDemo, portfolio, quotas]);

  const propertyOwners = useMemo(() => {
    if (!id) return [];
    return ownersWithBalances.filter((o) => o.condominiumId === id);
  }, [id, ownersWithBalances]);

  const propertyPayments = useMemo(() => {
    if (!id) return [];
    return payments.filter((p) => p.propertyId === id);
  }, [id, payments]);

  const propertyOccurrences = useMemo(() => {
    if (!id) return [];
    return mockOccurrences.filter((o) => o.condominiumId === id);
  }, [id]);

  const collectionDataForProperty = useMemo(() => {
    if (!condo || !stats) return null;
    return collectionSummaryForCondo(condo, stats);
  }, [condo, stats]);

  if (!id || !condo || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Breadcrumb />
            <div className="bg-surface rounded-lg border border-border-light p-8 text-center">
              <Icon
                name="Building2"
                size={48}
                className="text-secondary-300 mx-auto mb-4"
              />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {t("notFound")}
              </h2>
              <p className="text-text-secondary mb-4">{t("notFoundDesc")}</p>
              <Link
                href="/properties-management"
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

  const address = formatPortugueseAddress(condo.address);
  const yearBuilt = new Date(condo.deedDate).getFullYear();
  const amenities = labelCommonAreas(condo.commonAreas);
  const lastUpdated = String(condo.internalRegulations.date).slice(0, 10);

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return "text-success";
    if (rate >= 90) return "text-warning";
    return "text-error";
  };

  const getCollectionRateBg = (rate: number) => {
    if (rate >= 95) return "bg-success-50";
    if (rate >= 90) return "bg-warning-50";
    return "bg-error-50";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <PropertyDetailHeader
                condo={condo}
                address={address}
                yearBuilt={yearBuilt}
                collectionRate={stats.collectionRate}
                buildingTypeLabel={tModal(
                  `buildingTypes.${buildingTypeI18nKey(condo.buildingType)}`,
                )}
                statusLabel={tModal(
                  `statuses.${condominiumStatusI18nKey(condo.status)}`,
                )}
                t={t}
                getCollectionRateBg={getCollectionRateBg}
                getCollectionRateColor={getCollectionRateColor}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <PropertyDetailStats
                condo={condo}
                stats={stats}
                owners={propertyOwners}
              />

              <PropertyOwnersList owners={propertyOwners} />

              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {t("finance")}
                </h2>
                {collectionDataForProperty && (
                  <CollectionSummary
                    collectionData={collectionDataForProperty}
                  />
                )}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-text-primary mb-3">
                    {t("paymentHistory")}
                  </h3>
                  <PaymentHistoryTable
                    payments={propertyPayments}
                    selectedPayments={[]}
                    onPaymentSelect={() => {}}
                    onSelectAll={() => {}}
                    onViewReceipt={() => {}}
                    onSendReminder={() => {}}
                    onMarkDisputed={() => {}}
                  />
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {t("occurrences")}
                </h2>
                <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
                  {propertyOccurrences.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                      <Icon
                        name="FileText"
                        size={40}
                        className="mx-auto mb-2 text-secondary-300"
                      />
                      <p>{t("noOccurrences")}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border-light">
                      {propertyOccurrences.map((occ) => (
                        <li key={occ.id}>
                          <Link
                            href={`/occurrences/${occ.id}`}
                            className="block px-6 py-4 hover:bg-secondary-50 transition-smooth"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-text-primary">
                                  {occ.title}
                                </p>
                                <p className="text-sm text-text-secondary">
                                  {tOccCategory(occ.category)} •{" "}
                                  {t("unit", { unit: occ.unit ?? "—" })} •{" "}
                                  {formatOccurrenceDate(occ.dateTime)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-text-secondary">
                                  {tOccPriority(occ.priority)}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-text-primary">
                                  {tOccState(occ.status)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="xl:col-span-1 space-y-6">
              <div className="bg-surface rounded-lg border border-border-light p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("propertyInfo")}
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-text-secondary">{t("address")}</dt>
                    <dd className="font-medium text-text-primary">{address}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("taxId")}</dt>
                    <dd className="font-medium text-text-primary">
                      {condo.taxId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("permillage")}</dt>
                    <dd className="font-medium text-text-primary">
                      {condo.totalPermillage}‰
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("buildingType")}</dt>
                    <dd className="font-medium text-text-primary">
                      {tModal(
                        `buildingTypes.${buildingTypeI18nKey(condo.buildingType)}`,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("status")}</dt>
                    <dd className="font-medium text-text-primary">
                      {tModal(
                        `statuses.${condominiumStatusI18nKey(condo.status)}`,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("deedDate")}</dt>
                    <dd className="font-medium text-text-primary">
                      {String(condo.deedDate).slice(0, 10)} ({yearBuilt})
                    </dd>
                  </div>
                  {condo.propertyRegistryNumber && (
                    <div>
                      <dt className="text-text-secondary">
                        {t("propertyRegistryNumber")}
                      </dt>
                      <dd className="font-medium text-text-primary">
                        {condo.propertyRegistryNumber}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-secondary">{t("units")}</dt>
                    <dd className="font-medium text-text-primary">
                      {stats.occupiedUnits}/{condo.numberOfUnits}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("feeRange")}</dt>
                    <dd className="font-medium text-text-primary">
                      {formatPriceString(stats.monthlyFeeRange)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("lastUpdated")}</dt>
                    <dd className="font-medium text-text-primary">
                      {lastUpdated}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("amenities")}</dt>
                    <dd className="font-medium text-text-primary">
                      {amenities.length > 0 ? amenities.join(", ") : "—"}
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
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="Edit2" size={16} className="mr-2 shrink-0" />
                    {t("editProperty")}
                  </button>
                  <Link
                    href="/owners-management"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="UserPlus" size={16} className="mr-2 shrink-0" />
                    {t("addOwner")}
                  </Link>
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
                  <Link
                    href="/payment-tracking"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="Receipt" size={16} className="mr-2 shrink-0" />
                    {t("viewPayments")}
                  </Link>
                </div>
                <Link
                  href="/properties-management"
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

      <PropertyModal
        isOpen={isEditModalOpen}
        property={condo}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(next) => {
          upsertCondominium(next);
          setIsEditModalOpen(false);
        }}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSubmit={async (paymentData) => {
          await recordPayment(paymentData);
          setIsRecordPaymentOpen(false);
        }}
      />
    </div>
  );
}

function PropertyDetailHeader({
  condo,
  address,
  yearBuilt,
  collectionRate,
  buildingTypeLabel,
  statusLabel,
  t,
  getCollectionRateBg,
  getCollectionRateColor,
}: {
  condo: Condominium;
  address: string;
  yearBuilt: number;
  collectionRate: number;
  buildingTypeLabel: string;
  statusLabel: string;
  t: ReturnType<typeof useTranslations<"propertiesManagement.detail">>;
  getCollectionRateBg: (rate: number) => string;
  getCollectionRateColor: (rate: number) => string;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {condo.name}
        </h1>
        <p className="text-text-secondary mb-3">{address}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-text-secondary">
            {buildingTypeLabel} • {t("built", { year: yearBuilt })}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCollectionRateBg(collectionRate)} ${getCollectionRateColor(collectionRate)}`}
          >
            {t("collectionRate", { rate: collectionRate })}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-text-primary">
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailPage;
