"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import Toast, { type ToastTone } from "@/components/ui/toast";
import type { Condominium, Owner, Unit } from "@/types";
import {
  compareUnits,
  formatPermillage,
  indexOccupantsByUnitId,
  permillageSummary,
} from "@/lib/portfolio";
import UnitModal from "./unit-modal";

interface UnitRegistryProps {
  condominium: Condominium;
  units: Unit[];
  owners: Owner[];
  onUpsert: (unit: Unit) => Promise<void>;
  onRemove: (unitId: string) => Promise<void>;
  openAddSignal?: number;
}

function UnitRegistry({
  condominium,
  units,
  owners,
  onUpsert,
  onRemove,
  openAddSignal = 0,
}: UnitRegistryProps) {
  const t = useTranslations("propertiesManagement.units");
  const tModal = useTranslations("propertiesManagement.unitModal");
  const tRole = useTranslations("ownersManagement.roles");
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [flash, setFlash] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);

  useEffect(() => {
    if (!openAddSignal) return;
    setEditingUnit(null);
    setIsModalOpen(true);
  }, [openAddSignal]);

  const sortedUnits = useMemo(
    () => [...units].sort(compareUnits),
    [units],
  );

  const summary = useMemo(
    () => permillageSummary(units, condominium.totalPermillage),
    [units, condominium.totalPermillage],
  );

  const occupantsByUnitId = useMemo(
    () => indexOccupantsByUnitId(units, owners),
    [units, owners],
  );

  const allocatedPercent = Math.min(
    100,
    summary.total > 0 ? (summary.allocated / summary.total) * 100 : 0,
  );

  const barClass = summary.isComplete
    ? "bg-success"
    : summary.isOver
      ? "bg-error"
      : "bg-warning";
  const statusClass = summary.isComplete
    ? "text-success"
    : summary.isOver
      ? "text-error"
      : "text-warning";
  const statusLabel = summary.isComplete
    ? t("permillageComplete")
    : summary.isOver
      ? t("permillageOver")
      : t("permillageUnder");

  const openAdd = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  const openEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleSave = async (unit: Unit) => {
    await onUpsert(unit);
    closeModal();
    setFlash({
      message: editingUnit ? t("updated") : t("created"),
      tone: "success",
    });
  };

  const handleDelete = async (unit: Unit) => {
    const linked = occupantsByUnitId.get(unit.id) ?? [];
    if (linked.length > 0) {
      setFlash({
        message: t("cannotDeleteLinked", { count: linked.length }),
        tone: "warning",
      });
      return;
    }
    if (!window.confirm(t("confirmDelete", { label: unit.label }))) {
      return;
    }
    try {
      await onRemove(unit.id);
      setFlash({ message: t("deleted"), tone: "success" });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setFlash({
        message:
          code === "unitHasOwners"
            ? tModal("errors.unitHasOwners")
            : tModal("errors.requestFailed"),
        tone: "warning",
      });
    }
  };

  return (
    <section id="unit-registry" className="space-y-3">
      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={() => setFlash(null)}
        />
      )}

      <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {t("count", { count: units.length })}
            </p>
          </div>
          <button
            type="button"
            data-add-unit
            onClick={openAdd}
            className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-smooth"
          >
            <Icon name="Plus" size={16} />
            <span>{t("add")}</span>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-border-light bg-secondary-50/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm text-text-primary">
              {t("permillageAllocated", {
                allocated: formatPermillage(summary.allocated, locale),
                total: formatPermillage(summary.total, locale),
              })}
            </p>
            <p className={`text-sm font-medium ${statusClass}`}>
              {statusLabel}
            </p>
          </div>
          <div
            className="h-2 rounded-full bg-secondary-200 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={summary.total}
            aria-valuenow={summary.allocated}
            aria-label={t("title")}
          >
            <div
              className={`h-full rounded-full transition-smooth ${barClass}`}
              style={{ width: `${allocatedPercent}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {summary.isOver
              ? t("permillageOverHint", {
                  amount: formatPermillage(
                    Math.abs(summary.remaining),
                    locale,
                  ),
                })
              : t("permillageRemaining", {
                  remaining: formatPermillage(summary.remaining, locale),
                })}
          </p>
        </div>

        {sortedUnits.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <Icon
              name="LayoutGrid"
              size={40}
              className="mx-auto mb-2 text-secondary-300"
            />
            <p className="font-medium text-text-primary mb-1">
              {t("emptyTitle")}
            </p>
            <p className="text-sm">{t("emptyHint")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border-light bg-secondary-50 text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-6 py-3 font-medium">{t("columns.label")}</th>
                  <th className="px-4 py-3 font-medium">{t("columns.floor")}</th>
                  <th className="px-4 py-3 font-medium">{t("columns.type")}</th>
                  <th className="px-4 py-3 font-medium text-right">
                    {t("columns.area")}
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    {t("columns.permillage")}
                  </th>
                  <th className="px-4 py-3 font-medium">{t("columns.owner")}</th>
                  <th className="px-6 py-3 font-medium text-right">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {sortedUnits.map((unit) => {
                  const occupants = occupantsByUnitId.get(unit.id) ?? [];
                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-secondary-50 transition-smooth"
                    >
                      <td className="px-6 py-3 font-medium text-text-primary">
                        {unit.label}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {unit.floor || "—"}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {t(`types.${unit.type}`)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        {unit.areaSqm != null
                          ? t("areaValue", { area: unit.areaSqm })
                          : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          unit.permillage <= 0
                            ? "text-warning"
                            : "text-text-primary"
                        }`}
                      >
                        {formatPermillage(unit.permillage, locale)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {occupants.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {occupants.map((occupant) => (
                              <Link
                                key={occupant.owner.id}
                                href={`/owners-management/${occupant.owner.id}`}
                                className="text-text-primary hover:text-primary transition-smooth"
                              >
                                {occupant.owner.fullName}
                                {occupant.role !== "owner"
                                  ? ` (${tRole(occupant.role)})`
                                  : ""}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          t("unassigned")
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(unit)}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-100 rounded-lg transition-smooth"
                            title={t("edit")}
                          >
                            <Icon name="Edit2" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(unit)}
                            className="p-2 text-text-secondary hover:text-error hover:bg-error-50 rounded-lg transition-smooth"
                            title={t("delete")}
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UnitModal
        isOpen={isModalOpen}
        unit={editingUnit}
        condominiumId={condominium.id}
        remainingPermillage={summary.remaining}
        totalPermillage={summary.total}
        onClose={closeModal}
        onSave={handleSave}
      />
    </section>
  );
}

export default UnitRegistry;
