"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { downloadCsv } from "@/lib/export-csv";
import { Occurrence } from "../types";
import {
  PRIORITY_BADGE,
  isOpenState,
  isResolvedState,
} from "./occurrence-meta";

function OccurrenceStatistics({ occurrences }: { occurrences: Occurrence[] }) {
  const t = useTranslations("occurrences.stats");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");

  const total = occurrences.length;
  const openCount = occurrences.filter((o) => isOpenState(o.state)).length;
  const urgentCount = occurrences.filter(
    (o) => o.priority === "URGENT" && isOpenState(o.state),
  ).length;
  const resolvedCount = occurrences.filter((o) =>
    isResolvedState(o.state),
  ).length;

  const resolutionRate =
    total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const stats = [
    {
      label: t("total"),
      value: total,
      icon: "ClipboardList",
      color: "text-primary",
      bgColor: "bg-primary-50",
    },
    {
      label: t("open"),
      value: openCount,
      icon: "CircleDot",
      color: "text-accent",
      bgColor: "bg-accent-50",
    },
    {
      label: t("urgent"),
      value: urgentCount,
      icon: "AlertTriangle",
      color: "text-error",
      bgColor: "bg-error-50",
    },
    {
      label: t("resolutionRate"),
      value: `${resolutionRate}%`,
      icon: "CheckCircle2",
      color: "text-success",
      bgColor: "bg-success-50",
    },
  ];

  const priorityStats = (["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map(
    (priority) => ({
      label: tPriority(priority),
      count: occurrences.filter((o) => o.priority === priority).length,
      color: PRIORITY_BADGE[priority].color,
      bgColor: PRIORITY_BADGE[priority].bg,
    }),
  );

  const handleExportList = () => {
    const headers = [
      t("csvHeaders.title"),
      t("csvHeaders.category"),
      t("csvHeaders.property"),
      t("csvHeaders.unit"),
      t("csvHeaders.priority"),
      t("csvHeaders.state"),
      t("csvHeaders.reportedBy"),
      t("csvHeaders.reportedAt"),
      t("csvHeaders.assignedTo"),
    ];
    const rows = occurrences.map((o) => [
      o.title,
      tCategory(o.category),
      o.property ?? "",
      o.unit ?? "",
      tPriority(o.priority),
      tState(o.state),
      o.reportedBy,
      o.reportedAt,
      o.assignedTo ?? "",
    ]);

    downloadCsv(headers, rows, "occurrences-export.csv");
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("title")}
        </h3>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <Icon name={stat.icon} size={20} className={stat.color} />
              </div>
              <div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
                <div className="text-lg font-semibold text-text-primary">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("byPriority")}
        </h3>
        <div className="space-y-3">
          {priorityStats.map((priority, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${priority.bgColor}`} />
                <span className="text-sm text-text-secondary">
                  {priority.label}
                </span>
              </div>
              <span className={`text-sm font-medium ${priority.color}`}>
                {priority.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border-light p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {t("quickActions")}
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="Bell" size={16} className="inline mr-2" />
            {t("notifyStaff")}
          </button>
          <button
            onClick={handleExportList}
            disabled={occurrences.length === 0}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            <Icon name="Download" size={16} className="inline mr-2" />
            {t("exportList")}
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth">
            <Icon name="FileText" size={16} className="inline mr-2" />
            {t("generateReport")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OccurrenceStatistics;
