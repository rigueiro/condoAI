"use client";

import Breadcrumb from "@/components/ui/breadcrumb";
import Header from "@/components/ui/header";
import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ControlPanel from "./components/control-panel";
import ReportTemplates from "./components/report-templates";
import ChartsSection from "./components/charts-section";
import DataTables from "./components/data-tables";
import GenerateReportSection from "./components/generate-report-section";
import type { Filters } from "./components/control-panel";
import { mockCondominiums } from "@/fixtures/domain";
import { mockCondoStats } from "@/fixtures/views";
import { useActiveCondominium } from "@/lib/portfolio";

function ReportsAnalytics() {
  const t = useTranslations("reportsAnalytics");
  const { activeId } = useActiveCondominium();

  const [filters, setFilters] = useState<Filters>(() => ({
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      end: new Date(),
    },
    selectedProperties: [],
    reportType: "financial-summary",
  }));

  const [reportData, setReportData] = useState({
    financialSummary: {
      totalCollected: 5420000,
      totalOutstanding: 125000,
      collectionRate: 92.5,
      averagePayment: 2450,
      monthOverMonth: 8.3,
    },
    collectionTrends: [
      { month: "Aug 2023", collected: 420000, target: 450000, rate: 93.3 },
      { month: "Sep 2023", collected: 445000, target: 450000, rate: 98.9 },
      { month: "Oct 2023", collected: 438000, target: 460000, rate: 95.2 },
      { month: "Nov 2023", collected: 452000, target: 470000, rate: 96.2 },
      { month: "Dec 2023", collected: 461000, target: 480000, rate: 96.0 },
      { month: "Jan 2024", collected: 472000, target: 500000, rate: 94.4 },
    ],
    propertyPerformance: mockCondominiums.map((condo) => {
      const stats = mockCondoStats(condo);
      const target = stats.averageFee * condo.numberOfUnits;
      const collected = Math.round(target * (stats.collectionRate / 100));
      return {
        propertyId: condo.id,
        property: condo.name,
        units: condo.numberOfUnits,
        collected,
        outstanding: Math.round(target - collected),
        rate: stats.collectionRate,
      };
    }),
    paymentDistribution: [
      { method: "Bank Transfer", count: 245, amount: 612500, percentage: 65.3 },
      { method: "Online Portal", count: 89, amount: 217800, percentage: 23.1 },
      { method: "Check", count: 32, amount: 78400, percentage: 8.5 },
      { method: "Cash", count: 12, amount: 29400, percentage: 3.1 },
    ],
  });

  const visibleReportData = useMemo(() => {
    if (!activeId) return reportData;
    return {
      ...reportData,
      propertyPerformance: reportData.propertyPerformance.filter(
        (row) => row.propertyId === activeId,
      ),
    };
  }, [activeId, reportData]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleExportData = (format: string, dataType: string) => {
    console.log(`Exporting ${dataType} data in ${format} format`);
    // Implementation for export functionality
  };

  const handleGenerateReport = (reportConfig: Record<string, unknown>) => {
    console.log("Generating custom report:", reportConfig);
    // Implementation for custom report generation
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 pb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary">{t("subtitle")}</p>
          </div>

          {/* Control Panel */}
          <ControlPanel filters={filters} onFilterChange={handleFilterChange} />

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            {/* Left Sidebar - Report Templates */}
            <div className="lg:col-span-3">
              <ReportTemplates
                onTemplateSelect={(config) =>
                  handleFilterChange({ reportType: config.reportType })
                }
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
              {/* Charts Section */}
              <ChartsSection reportData={visibleReportData} filters={filters} />

              {/* Data Tables */}
              <DataTables
                reportData={visibleReportData}
                onExport={handleExportData}
              />

              {/* Generate Report Section */}
              <GenerateReportSection onGenerateReport={handleGenerateReport} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportsAnalytics;
