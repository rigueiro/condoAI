"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import CollectionSummary from "@/app/[locale]/payment-tracking/components/collection-summary";
import PaymentHistoryTable from "@/app/[locale]/payment-tracking/components/payment-history-table";
import { mockProperties } from "../__fixtures__/mock-properties";
import { mockPayments } from "@/app/[locale]/payment-tracking/__fixtures__/mock-payments";
import { mockOccurrences } from "@/app/[locale]/occurrences/__fixtures__/mock-occurrences";

function PropertyDetailPage() {
  const t = useTranslations("propertiesManagement.detail");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const property = useMemo(
    () => (id ? mockProperties.find((p) => p.id === id) : undefined),
    [id],
  );

  const propertyPayments = useMemo(() => {
    if (!id) return [];
    return mockPayments.filter(
      (p) => p.propertyId === id || (p.propertyId == null && p.property === property?.name),
    );
  }, [id, property?.name]);

  const propertyOccurrences = useMemo(() => {
    if (!id) return [];
    return mockOccurrences.filter((o) => o.propertyId === id);
  }, [id]);

  const collectionDataForProperty = useMemo(() => {
    if (!property) return null;
    const target = property.totalUnits * property.averageFee;
    const collected = (target * property.collectionRate) / 100;
    const outstanding = target - collected;
    return {
      currentMonth: {
        totalTarget: target,
        totalCollected: collected,
        collectionRate: property.collectionRate,
        outstandingBalance: outstanding,
        totalProperties: 1,
      },
      propertyBreakdown: [
        {
          id: property.id,
          name: property.name,
          unitsCount: property.totalUnits,
          collected: Math.round(collected),
          target,
          collectionRate: property.collectionRate,
          outstanding: Math.round(outstanding),
        },
      ],
    };
  }, [property]);

  const [currentUser] = React.useState({
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@propertyhub.com",
    role: "Property Manager",
  });

  const handleLogout = () => console.log("Logging out...");

  const paymentsForTable = useMemo(() => propertyPayments, [propertyPayments]);

  if (!id || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Breadcrumb />
            <div className="bg-surface rounded-lg border border-border-light p-8 text-center">
              <Icon name="Building2" size={48} className="text-secondary-300 mx-auto mb-4" />
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
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          {/* Property header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {property.name}
                </h1>
                <p className="text-text-secondary mb-3">{property.address}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-text-secondary">
                    {property.buildingType} •{" "}
                    {t("built", { year: property.yearBuilt })}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCollectionRateBg(property.collectionRate)} ${getCollectionRateColor(property.collectionRate)}`}
                  >
                    {t("collectionRate", { rate: property.collectionRate })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">{t("units")} </span>
                  <span className="font-medium text-text-primary">
                    {property.occupiedUnits}/{property.totalUnits}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">{t("feeRange")} </span>
                  <span className="font-medium text-text-primary">
                    {property.monthlyFeeRange}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main: Finance + Occurrences */}
            <div className="xl:col-span-2 space-y-8">
              {/* Finance */}
              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {t("finance")}
                </h2>
                {collectionDataForProperty && (
                  <CollectionSummary collectionData={collectionDataForProperty} />
                )}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-text-primary mb-3">
                    {t("paymentHistory")}
                  </h3>
                  <PaymentHistoryTable
                    payments={paymentsForTable}
                    selectedPayments={[]}
                    onPaymentSelect={() => {}}
                    onSelectAll={() => {}}
                    onViewReceipt={() => {}}
                    onSendReminder={() => {}}
                    onMarkDisputed={() => {}}
                  />
                </div>
              </section>

              {/* Occurrences */}
              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {t("occurrences")}
                </h2>
                <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
                  {propertyOccurrences.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                      <Icon name="FileText" size={40} className="mx-auto mb-2 text-secondary-300" />
                      <p>{t("noOccurrences")}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border-light">
                      {propertyOccurrences.map((occ) => (
                        <li key={occ.id} className="px-6 py-4 hover:bg-secondary-50 transition-smooth">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-text-primary">
                                {occ.title}
                              </p>
                              <p className="text-sm text-text-secondary">
                                {occ.category} • {t("unit", { unit: occ.unit ?? "—" })} •{" "}
                                {occ.reportedAt}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-secondary">
                                {occ.priority}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-text-primary">
                                {occ.state}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar: property summary */}
            <div className="xl:col-span-1">
              <div className="bg-surface rounded-lg border border-border-light p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("summary")}
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-text-secondary">{t("status")}</dt>
                    <dd className="font-medium text-text-primary">
                      {property.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("lastUpdated")}</dt>
                    <dd className="font-medium text-text-primary">
                      {property.lastUpdated}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("amenities")}</dt>
                    <dd className="font-medium text-text-primary">
                      {property.amenities.join(", ")}
                    </dd>
                  </div>
                </dl>
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
    </div>
  );
}

export default PropertyDetailPage;
