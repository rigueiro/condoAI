"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Image from "@/components/image";
import { Owner, PaymentStatus } from "./types";

type SortKey = keyof Owner;
type SortDirection = "asc" | "desc";

interface Props {
  owners: Owner[];
  selectedOwners: string[];
  onOwnerSelect: (ownerId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onEditOwner: (owner: Owner) => void;
  onDeleteOwner: (ownerId: string) => void;
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
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: SortDirection;
  }>({ key: null, direction: "asc" });

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
      const aValue = a[key];
      const bValue = b[key];

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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        {label}
      </span>
    );
  };

  const SortableHeader = ({
    children,
    sortKey,
    className = "",
  }: {
    children: string;
    sortKey: SortKey;
    className?: string;
  }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-secondary-50 transition-smooth ${className}`}
      onClick={() => handleSort(sortKey)}
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

  const allSelected =
    owners.length > 0 && selectedOwners.length === owners.length;
  const someSelected =
    selectedOwners.length > 0 && selectedOwners.length < owners.length;

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      {/* Desktop Table */}
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
              <SortableHeader sortKey="name">{t("owner")}</SortableHeader>
              <SortableHeader sortKey="unit">{t("unit")}</SortableHeader>
              <SortableHeader sortKey="property">{t("property")}</SortableHeader>
              <SortableHeader sortKey="currentBalance">{t("balance")}</SortableHeader>
              <SortableHeader sortKey="paymentStatus">{t("status")}</SortableHeader>
              <SortableHeader sortKey="lastPayment">
                {t("lastPayment")}
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {sortedOwners.map((owner) => (
              <tr
                key={owner.id}
                className="hover:bg-secondary-50 transition-smooth"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOwners.includes(owner.id)}
                    onChange={(e) => onOwnerSelect(owner.id, e.target.checked)}
                    className="rounded border-border-medium text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary-100">
                      <Image
                        src={owner.avatar || ""}
                        alt={owner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {owner.name}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {owner.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">
                    {owner.unit}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    {owner.property}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`text-sm font-medium ${owner.currentBalance > 0 ? "text-error" : "text-success"}`}
                  >
                    ${owner.currentBalance.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getPaymentStatusBadge(owner.paymentStatus)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary">
                    {owner.lastPayment}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditOwner(owner)}
                      className="p-1 text-text-secondary hover:text-primary transition-smooth"
                      title={t("editOwner")}
                    >
                      <Icon name="Edit2" size={16} />
                    </button>
                    <button
                      className="p-1 text-text-secondary hover:text-accent transition-smooth"
                      title={t("viewPaymentHistory")}
                    >
                      <Icon name="CreditCard" size={16} />
                    </button>
                    <button
                      className="p-1 text-text-secondary hover:text-warning transition-smooth"
                      title={t("sendNotification")}
                    >
                      <Icon name="Mail" size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteOwner(owner.id)}
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

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border-light">
        {sortedOwners.map((owner) => (
          <div key={owner.id} className="p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedOwners.includes(owner.id)}
                onChange={(e) => onOwnerSelect(owner.id, e.target.checked)}
                className="mt-1 rounded border-border-medium text-primary focus:ring-primary"
              />
              <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary-100">
                <Image
                  src={owner.avatar || ""}
                  alt={owner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {owner.name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {owner.unit} • {owner.property}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditOwner(owner)}
                      className="p-2 text-text-secondary hover:text-primary transition-smooth"
                    >
                      <Icon name="Edit2" size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteOwner(owner.id)}
                      className="p-2 text-text-secondary hover:text-error transition-smooth"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`text-sm font-medium ${owner.currentBalance > 0 ? "text-error" : "text-success"}`}
                    >
                      ${owner.currentBalance.toLocaleString()}
                    </div>
                    {getPaymentStatusBadge(owner.paymentStatus)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  {t("lastPaymentMobile")} {owner.lastPayment}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
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
