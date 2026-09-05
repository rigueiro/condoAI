"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Toast from "@/components/ui/toast";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { usePortfolio } from "@/lib/portfolio";
import {
  useOperations,
  vendorNameById,
  buildVendorReferenceCounts,
  type ContractAttentionItem,
  type OperationsKind,
  type OperationsTab,
} from "@/lib/operations";
import { useFinance } from "@/lib/finance";
import { useOccurrences } from "@/lib/occurrences";
import { useWorks, worksVendorIds } from "@/lib/works";
import type { Equipment } from "@/types";
import DocumentCell from "./components/document-cell";
import OperationsModal, {
  type OperationsRecord,
} from "./components/operations-modal";
import RecordsTable from "./components/records-table";

function filterBySearch<T>(
  items: T[],
  searchLower: string,
  textFor: (item: T) => string,
): T[] {
  if (!searchLower) return items;
  return items.filter((item) =>
    textFor(item).toLowerCase().includes(searchLower),
  );
}

function statusBadgeClass(status: Equipment["status"]): string {
  if (status === "operational") {
    return "bg-success-50 text-success";
  }
  if (status === "maintenance") {
    return "bg-warning-50 text-warning";
  }
  return "bg-error-50 text-error";
}

function attentionLabel(
  item: ContractAttentionItem,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  if (item.daysUntil < 0) {
    return t("attention.daysOverdue", { count: Math.abs(item.daysUntil) });
  }
  if (item.daysUntil === 0) return t("attention.dueToday");
  return t("attention.daysLeft", { count: item.daysUntil });
}

function OperationsPage() {
  const t = useTranslations("operations");
  const { formatCurrency } = useFormatCurrency();
  const { portfolio } = usePortfolio();
  const condominiums = portfolio.condominiums;
  const preferredId = condominiums[0]?.id ?? "";

  const {
    vendors,
    contracts,
    equipment,
    contractAttention,
    upsertVendor,
    removeVendor,
    upsertContract,
    removeContract,
    upsertEquipment,
    removeEquipment,
  } = useOperations();
  const { expenses } = useFinance();
  const { occurrences } = useOccurrences();
  const { projects, interventions } = useWorks();

  const [tab, setTab] = useState<OperationsTab>("vendor");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OperationsRecord | null>(null);
  const [flash, setFlash] = useState<{
    message: string;
    tone: "success" | "warning";
  } | null>(null);

  const dismissFlash = useCallback(() => setFlash(null), []);

  const condoOptions = useMemo(
    () => condominiums.map((c) => ({ id: c.id, name: c.name })),
    [condominiums],
  );

  const condoNameById = useMemo(
    () => new Map(condoOptions.map((c) => [c.id, c.name])),
    [condoOptions],
  );

  const vendorNames = useMemo(() => vendorNameById(vendors), [vendors]);

  const nameOf = (id: string) => condoNameById.get(id) ?? id;
  const searchLower = search.trim().toLowerCase();

  const vendorReferenceCounts = useMemo(
    () =>
      buildVendorReferenceCounts(
        contracts,
        expenses,
        occurrences,
        worksVendorIds(projects, interventions),
      ),
    [contracts, expenses, interventions, occurrences, projects],
  );

  const filteredVendors = useMemo(
    () =>
      filterBySearch(
        vendors,
        searchLower,
        (v) =>
          `${v.name} ${v.nif} ${v.services} ${v.email} ${nameOf(v.condominiumId)}`,
      ),
    [vendors, searchLower, condoNameById],
  );

  const filteredContracts = useMemo(
    () =>
      filterBySearch(
        contracts,
        searchLower,
        (c) =>
          `${vendorNames.get(c.vendorId) ?? ""} ${c.service} ${nameOf(c.condominiumId)}`,
      ),
    [contracts, searchLower, condoNameById, vendorNames],
  );

  const filteredEquipment = useMemo(
    () =>
      filterBySearch(
        equipment,
        searchLower,
        (e) =>
          `${e.type} ${e.brand} ${e.location} ${nameOf(e.condominiumId)}`,
      ),
    [equipment, searchLower, condoNameById],
  );

  const tabs: { key: OperationsTab; count: number }[] = [
    { key: "vendor", count: filteredVendors.length },
    { key: "contract", count: filteredContracts.length },
    { key: "equipment", count: filteredEquipment.length },
  ];

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record: OperationsRecord) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSave = (record: OperationsRecord) => {
    if (record.kind === "vendor") upsertVendor(record.data);
    else if (record.kind === "contract") upsertContract(record.data);
    else upsertEquipment(record.data);
    setModalOpen(false);
    setEditing(null);
    setFlash({ message: t("flash.saved"), tone: "success" });
  };

  const handleDelete = async (kind: OperationsKind, id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    if (kind === "vendor") {
      const ok = await removeVendor(id);
      if (!ok) {
        setFlash({ message: t("flash.vendorBlocked"), tone: "warning" });
        return;
      }
    } else if (kind === "contract") {
      removeContract(id);
    } else {
      removeEquipment(id);
    }
    setFlash({ message: t("flash.deleted"), tone: "success" });
  };

  const defaultKind: OperationsKind = tab;

  const actionCell = (
    record: OperationsRecord,
    options?: { deleteDisabled?: boolean },
  ) => (
    <td className="px-4 py-3 text-right">
      <div className="flex justify-end gap-1">
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          title={t("table.edit")}
          onClick={() => openEdit(record)}
        >
          <Icon name="Edit2" size={16} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
          title={
            options?.deleteDisabled
              ? t("table.deleteBlocked")
              : t("table.delete")
          }
          disabled={options?.deleteDisabled}
          onClick={() => void handleDelete(record.kind, record.data.id)}
        >
          <Icon name="Trash2" size={16} />
        </button>
      </div>
    </td>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary sm:text-base">
              {t("subtitle")}
            </p>
          </div>
          <Button variant="primary" iconName="Plus" onClick={openAdd}>
            {t("add")}
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            {
              label: t("stats.vendors"),
              value: filteredVendors.length,
              icon: "Building2",
            },
            {
              label: t("stats.contracts"),
              value: filteredContracts.length,
              icon: "FileText",
            },
            {
              label: t("stats.equipment"),
              value: filteredEquipment.length,
              icon: "Cog",
            },
            {
              label: t("stats.attention"),
              value: contractAttention.length,
              icon: "AlertTriangle",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-light bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-2 text-text-secondary">
                <Icon name={stat.icon} size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.search")}
              className="w-full rounded-lg border border-border-medium bg-surface py-2 pl-9 pr-3 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1 border-b border-border-light">
          {tabs.map(({ key, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-smooth ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t(`tabs.${key}`)}
              <span className="ml-1.5 text-xs text-text-secondary">
                ({count})
              </span>
            </button>
          ))}
        </div>

        {tab === "vendor" && (
          <RecordsTable
            headers={[
              t("table.condominium"),
              t("table.name"),
              t("table.nif"),
              t("table.contact"),
              t("table.services"),
              t("table.actions"),
            ]}
            colSpan={6}
            empty={filteredVendors.length === 0}
          >
            {filteredVendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3 text-text-primary">
                  {nameOf(v.condominiumId)}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {v.name}
                </td>
                <td className="px-4 py-3 text-text-secondary">{v.nif || "—"}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {[v.email, v.phone].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {v.services || "—"}
                </td>
                {actionCell(
                  { kind: "vendor", data: v },
                  {
                    deleteDisabled: (vendorReferenceCounts.get(v.id) ?? 0) > 0,
                  },
                )}
              </tr>
            ))}
          </RecordsTable>
        )}

        {tab === "contract" && (
          <div className="space-y-4">
            {contractAttention.length > 0 && (
              <div className="rounded-xl border border-border-light bg-surface p-4">
                <h2 className="mb-3 text-sm font-semibold text-text-primary">
                  {t("attention.title")}
                </h2>
                <ul className="space-y-2">
                  {contractAttention.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {item.vendorName} · {item.service}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.condominiumName} · {item.endDate}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.urgency === "overdue"
                            ? "bg-error-50 text-error"
                            : "bg-warning-50 text-warning"
                        }`}
                      >
                        {attentionLabel(item, t)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.vendor"),
                t("table.service"),
                t("table.monthlyValue"),
                t("table.startDate"),
                t("table.endDate"),
                t("table.document"),
                t("table.actions"),
              ]}
              colSpan={8}
              empty={filteredContracts.length === 0}
            >
              {filteredContracts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{nameOf(c.condominiumId)}</td>
                  <td className="px-4 py-3 font-medium">
                    {vendorNames.get(c.vendorId) ?? c.vendorId}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.service}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(c.monthlyValue)}
                  </td>
                  <td className="px-4 py-3">
                    {String(c.startDate).slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {c.endDate
                      ? String(c.endDate).slice(0, 10)
                      : t("table.openEnded")}
                  </td>
                  <DocumentCell value={c.document} />
                  {actionCell({ kind: "contract", data: c })}
                </tr>
              ))}
            </RecordsTable>
          </div>
        )}

        {tab === "equipment" && (
          <RecordsTable
            headers={[
              t("table.condominium"),
              t("table.type"),
              t("table.brand"),
              t("table.location"),
              t("table.installed"),
              t("table.status"),
              t("table.actions"),
            ]}
            colSpan={7}
            empty={filteredEquipment.length === 0}
          >
            {filteredEquipment.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">{nameOf(e.condominiumId)}</td>
                <td className="px-4 py-3 font-medium">{e.type}</td>
                <td className="px-4 py-3 text-text-secondary">{e.brand}</td>
                <td className="px-4 py-3 text-text-secondary">{e.location}</td>
                <td className="px-4 py-3">
                  {String(e.installationDate).slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(e.status)}`}
                  >
                    {t(`status.${e.status}`)}
                  </span>
                </td>
                {actionCell({ kind: "equipment", data: e })}
              </tr>
            ))}
          </RecordsTable>
        )}
      </div>

      {modalOpen && (
        <OperationsModal
          record={editing}
          defaultKind={defaultKind}
          condominiums={condoOptions}
          vendors={vendors}
          defaultCondominiumId={preferredId}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={dismissFlash}
        />
      )}
    </div>
  );
}

export default OperationsPage;
