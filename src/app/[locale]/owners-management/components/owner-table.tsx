"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Image from "@/components/image";
import { type OwnerRow, type PaymentStatus, type SortConfig, paymentStatusLabel, paymentStatusStyle } from "./types";

type SortKey = SortConfig["key"];
type SortDirection = SortConfig["direction"];

interface Props {
  owners: OwnerRow[];
  selectedOwners: string[];
  onOwnerSelect: (ownerId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onEditOwner: (owner: OwnerRow) => void;
  onDeleteOwner: (ownerId: string) => void;
}

function SortableHeader({
  children,
  sortKey,
  className = "",
  sortConfig,
  onSort,
}: {
  children: string;
  sortKey: SortKey;
  className?: string;
  sortConfig: { key: SortKey | null; direction: SortDirection };
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-secondary-50 transition-smooth ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <Icon
            name="ChevronUp"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "asc" ? "text-primary" : "text-secondary-300"}`}
          />
          <Icon
            name="ChevronDown"
            size={12}
            className={`${sortConfig.key === sortKey && sortConfig.direction === "desc" ? "text-primary" : "text-secondary-300"} -mt-1`}
          />
        </div>
      </div>
    </th>
  );
}

function sortValue(row: OwnerRow, key: SortKey): string | number {
  switch (key) {
    case "fullName":
      return row.owner.fullName;
    case "unitLabel":
      return row.unitLabel;
    case "condominiumName":
      return row.condominiumName;
    case "currentBalance":
      return row.currentBalance;
    case "paymentStatus":
      return row.paymentStatus;
    case "lastPayment":
      return row.lastPayment;
  }
}

function OwnerTable({
  owners,
  selectedOwners,
  onOwnerSelect,
  onSelectAll,
  onEditOwner,
  onDeleteOwner,
}: Props) {
  const t = useTranslations("ownersManagement.table");
  const tStatus = useTranslations("ownersManagement.status");
  const { formatCurrency } = useFormatCurrency();
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "asc",
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedOwners = React.useMemo(() => {
    const key = sortConfig.key;
    if (!key) return owners;

    return [...owners].sort((a, b) => {
      const aValue = sortValue(a, key);
      const bValue = sortValue(b, key);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [owners, sortConfig]);

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = paymentStatusStyle(status);
    return (
      <span
        className={`inline-flex text-overflow-wrap-nowrap truncate text-ellipsis items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        {tStatus(paymentStatusLabel(status))}
      </span>
    );
  };

  const allSelected =
    owners.length > 0 && selectedOwners.length === owners.length;
  const someSelected =
    selectedOwners.length > 0 && selectedOwners.length < owners.length;

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border-medium text-primary focus:ring-primary"
                />
              </th>
              <SortableHeader
                sortKey="fullName"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("owner")}
              </SortableHeader>
              <SortableHeader
                sortKey="unitLabel"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("unit")}
              </SortableHeader>
              <SortableHeader
                sortKey="condominiumName"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("property")}
              </SortableHeader>
              <SortableHeader
                sortKey="currentBalance"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("balance")}
              </SortableHeader>
              <SortableHeader
                sortKey="paymentStatus"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("status")}
              </SortableHeader>
              <SortableHeader
                sortKey="lastPayment"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                {t("lastPayment")}
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {sortedOwners.map((row) => (
              <tr
                key={row.owner.id}
                className="hover:bg-secondary-50 transition-smooth"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOwners.includes(row.owner.id)}
                    onChange={(e) =>
                      onOwnerSelect(row.owner.id, e.target.checked)
                    }
                    className="rounded border-border-medium text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary-100">
                      <Image
                        src={row.avatar || ""}
                        alt={row.owner.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/owners-management/${row.owner.id}`}
                        className="text-sm font-medium text-text-primary hover:text-primary transition-smooth"
                      >
                        {row.owner.fullName}
                      </Link>
                      <div className="text-sm text-text-secondary">
                        {row.owner.contacts.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {row.unitLabel}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {row.condominiumName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${row.currentBalance > 0 ? "text-error" : "text-success"}`}
                  >
                    {formatCurrency(row.currentBalance)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getPaymentStatusBadge(row.paymentStatus)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary">
                    {row.lastPayment}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditOwner(row)}
                      className="p-1 text-text-secondary hover:text-primary transition-smooth"
                      title={t("editOwner")}
                    >
                      <Icon name="Edit2" size={16} />
                    </button>
                    <Link
                      href={`/owners-management/${row.owner.id}`}
                      className="p-1 text-text-secondary hover:text-accent transition-smooth"
                      title={t("viewPaymentHistory")}
                    >
                      <Icon name="CreditCard" size={16} />
                    </Link>
                    <button
                      className="p-1 text-text-secondary hover:text-warning transition-smooth"
                      title={t("sendNotification")}
                    >
                      <Icon name="Mail" size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteOwner(row.owner.id)}
                      className="p-1 text-text-secondary hover:text-error transition-smooth"
                      title={t("deleteOwner")}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-border-light">
        {sortedOwners.map((row) => (
          <div key={row.owner.id} className="p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedOwners.includes(row.owner.id)}
                onChange={(e) =>
                  onOwnerSelect(row.owner.id, e.target.checked)
                }
                className="mt-1 rounded border-border-medium text-primary focus:ring-primary"
              />
              <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary-100">
                <Image
                  src={row.avatar || ""}
                  alt={row.owner.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/owners-management/${row.owner.id}`}
                      className="text-sm font-medium text-text-primary hover:text-primary transition-smooth"
                    >
                      {row.owner.fullName}
                    </Link>
                    <p className="text-sm text-text-secondary">
                      {row.unitLabel} • {row.condominiumName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditOwner(row)}
                      className="p-2 text-text-secondary hover:text-primary transition-smooth"
                    >
                      <Icon name="Edit2" size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteOwner(row.owner.id)}
                      className="p-2 text-text-secondary hover:text-error transition-smooth"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`text-sm font-medium ${row.currentBalance > 0 ? "text-error" : "text-success"}`}
                    >
                      {formatCurrency(row.currentBalance)}
                    </div>
                    {getPaymentStatusBadge(row.paymentStatus)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  {t("lastPaymentMobile")} {row.lastPayment}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {owners.length === 0 && (
        <div className="text-center py-12">
          <Icon
            name="Users"
            size={48}
            className="mx-auto text-secondary-300 mb-4"
          />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {t("noResults")}
          </h3>
          <p className="text-text-secondary">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}

export default OwnerTable;
