"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { usePortfolio } from "@/lib/portfolio";
import {
  summarizeBudget,
  useFinance,
  type DraftBudgetItem,
  type FinanceKind,
  type FinanceTab,
  type IssueExtraordinaryInput,
} from "@/lib/finance";
import DraftsPanel from "./components/drafts-panel";
import ExtraordinaryQuotaModal from "./components/extraordinary-quota-modal";
import FinanceModal, {
  type FinanceRecord,
} from "./components/finance-modal";
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

function FinancePage() {
  const t = useTranslations("finance");
  const { formatCurrency } = useFormatCurrency();
  const { portfolio } = usePortfolio();
  const condominiums = portfolio.condominiums;
  const preferredId = condominiums[0]?.id ?? "";

  const {
    budgets,
    expenses,
    accounts,
    extraordinaryQuotas,
    draftItems,
    upsertAnnualBudget,
    removeAnnualBudget,
    markBudgetApproved,
    upsertExpenseRecord,
    removeExpenseRecord,
    upsertBankAccount,
    removeBankAccount,
    issueExtraordinaryQuota,
  } = useFinance();

  const [tab, setTab] = useState<FinanceTab>("attention");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [flashTone, setFlashTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 3000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const condoOptions = useMemo(
    () => condominiums.map((c) => ({ id: c.id, name: c.name })),
    [condominiums],
  );

  const condoNameById = useMemo(
    () => new Map(condoOptions.map((c) => [c.id, c.name])),
    [condoOptions],
  );

  const showFlash = (text: string, tone: "success" | "error" = "success") => {
    setFlashTone(tone);
    setFlash(text);
  };

  const nameOf = (id: string) => condoNameById.get(id) ?? id;
  const searchLower = search.trim().toLowerCase();

  const totalBankBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.currentBalance, 0),
    [accounts],
  );

  // Search only on the active tab; other tabs keep full counts.
  const filteredBudgets = useMemo(() => {
    if (tab !== "budget") return budgets;
    return filterBySearch(
      budgets,
      searchLower,
      (b) =>
        `${b.year} ${b.status} ${nameOf(b.condominiumId)} ${Object.keys(b.valuesByCategory).join(" ")}`,
    );
  }, [budgets, searchLower, tab, condoNameById]);

  const filteredExpenses = useMemo(() => {
    if (tab !== "expense") return expenses;
    return filterBySearch(
      expenses,
      searchLower,
      (e) => `${e.category} ${e.supplier} ${nameOf(e.condominiumId)}`,
    );
  }, [expenses, searchLower, tab, condoNameById]);

  const filteredAccounts = useMemo(() => {
    if (tab !== "bank") return accounts;
    return filterBySearch(
      accounts,
      searchLower,
      (a) => `${a.bank} ${a.iban} ${nameOf(a.condominiumId)}`,
    );
  }, [accounts, searchLower, tab, condoNameById]);

  const filteredExtras = useMemo(() => {
    if (tab !== "extraordinary") return extraordinaryQuotas;
    return filterBySearch(
      extraordinaryQuotas,
      searchLower,
      (item) => `${item.description} ${nameOf(item.condominiumId)}`,
    );
  }, [extraordinaryQuotas, searchLower, tab, condoNameById]);

  const tabs: { key: FinanceTab; count: number }[] = [
    { key: "attention", count: draftItems.length },
    { key: "budget", count: filteredBudgets.length },
    { key: "extraordinary", count: filteredExtras.length },
    { key: "expense", count: filteredExpenses.length },
    { key: "bank", count: filteredAccounts.length },
  ];

  const openAdd = () => {
    if (tab === "extraordinary") {
      setExtraOpen(true);
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record: FinanceRecord) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSave = (record: FinanceRecord) => {
    if (record.kind === "budget") upsertAnnualBudget(record.data);
    else if (record.kind === "expense") upsertExpenseRecord(record.data);
    else upsertBankAccount(record.data);
    setModalOpen(false);
    setEditing(null);
    showFlash(t("flash.saved"));
    if (tab === "attention" && record.kind !== "budget") {
      setTab(record.kind);
    }
  };

  const handleDelete = (kind: FinanceKind, id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    if (kind === "budget") removeAnnualBudget(id);
    else if (kind === "expense") removeExpenseRecord(id);
    else removeBankAccount(id);
    showFlash(t("flash.deleted"));
  };

  const handleApprove = (item: DraftBudgetItem) => {
    markBudgetApproved(item.id);
    showFlash(t("flash.approved"));
  };

  const handleIssueExtra = async (input: IssueExtraordinaryInput) => {
    const result = await issueExtraordinaryQuota(input);
    if (result.ok) {
      showFlash(t("flash.issued"));
      return true;
    }
    showFlash(
      result.code === "noBilledOwners"
        ? t("flash.noBilledOwners")
        : t("flash.issueFailed"),
      "error",
    );
    return false;
  };

  const defaultKind: FinanceKind =
    tab === "attention" || tab === "extraordinary" ? "budget" : tab;

  const actionCell = (record: FinanceRecord) => (
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
          className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error"
          title={t("table.delete")}
          onClick={() => handleDelete(record.kind, record.data.id)}
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
            <Button
              variant="primary"
              iconName="Plus"
              onClick={openAdd}
            >
              {tab === "extraordinary" ? t("addExtraordinary") : t("add")}
            </Button>
          </div>

          {flash && (
            <div
              className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
                flashTone === "error"
                  ? "border-error-100 bg-error-50 text-error"
                  : "border-success-100 bg-success-50 text-success"
              }`}
            >
              {flash}
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: t("stats.drafts"),
                value: String(draftItems.length),
                icon: "FilePen",
              },
              {
                label: t("stats.budgets"),
                value: String(budgets.length),
                icon: "Wallet",
              },
              {
                label: t("stats.expenses"),
                value: String(expenses.length),
                icon: "Receipt",
              },
              {
                label: t("stats.balance"),
                value: formatCurrency(totalBankBalance),
                icon: "Landmark",
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

          {tab === "attention" && (
            <DraftsPanel items={draftItems} onApprove={handleApprove} />
          )}

          {tab === "budget" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.year"),
                t("table.status"),
                t("table.total"),
                t("table.categories"),
                t("table.actions"),
              ]}
              colSpan={6}
              empty={filteredBudgets.length === 0}
            >
              {filteredBudgets.map((b) => {
                const summary = summarizeBudget(b);
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-text-primary">
                      {nameOf(b.condominiumId)}
                    </td>
                    <td className="px-4 py-3">{b.year}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                          b.status === "approved"
                            ? "bg-success-50 text-success"
                            : "bg-warning-50 text-warning"
                        }`}
                      >
                        {t(`status.${b.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{formatCurrency(summary.collectable)}</span>
                        {summary.shortfall > 0 && (
                          <span className="inline-flex rounded-md bg-error-50 px-2 py-0.5 text-xs font-medium text-error">
                            {t("table.reserveShort")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {Object.keys(b.valuesByCategory).length}
                    </td>
                    {actionCell({ kind: "budget", data: b })}
                  </tr>
                );
              })}
            </RecordsTable>
          )}

          {tab === "extraordinary" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.date"),
                t("table.description"),
                t("table.total"),
                t("table.owners"),
              ]}
              colSpan={5}
              empty={filteredExtras.length === 0}
            >
              {filteredExtras.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-text-primary">
                    {nameOf(item.condominiumId)}
                  </td>
                  <td className="px-4 py-3">{item.date.slice(0, 10)}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(item.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {item.ownerCount}
                  </td>
                </tr>
              ))}
            </RecordsTable>
          )}

          {tab === "expense" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.date"),
                t("table.category"),
                t("table.supplier"),
                t("table.amount"),
                t("table.actions"),
              ]}
              colSpan={6}
              empty={filteredExpenses.length === 0}
            >
              {filteredExpenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">{nameOf(e.condominiumId)}</td>
                  <td className="px-4 py-3">{String(e.date).slice(0, 10)}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3 text-text-secondary">{e.supplier}</td>
                  <td className="px-4 py-3">{formatCurrency(e.amount)}</td>
                  {actionCell({ kind: "expense", data: e })}
                </tr>
              ))}
            </RecordsTable>
          )}

          {tab === "bank" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.bank"),
                t("table.iban"),
                t("table.balance"),
                t("table.actions"),
              ]}
              colSpan={5}
              empty={filteredAccounts.length === 0}
            >
              {filteredAccounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{nameOf(a.condominiumId)}</td>
                  <td className="px-4 py-3">{a.bank}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {a.iban}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(a.currentBalance)}
                  </td>
                  {actionCell({ kind: "bank", data: a })}
                </tr>
              ))}
            </RecordsTable>
          )}
      </div>

      {modalOpen && (
        <FinanceModal
          record={editing}
          defaultKind={defaultKind}
          condominiums={condoOptions}
          defaultCondominiumId={preferredId}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      {extraOpen && (
        <ExtraordinaryQuotaModal
          condominiums={condoOptions}
          units={portfolio.units}
          owners={portfolio.owners}
          defaultCondominiumId={preferredId}
          onClose={() => setExtraOpen(false)}
          onIssue={handleIssueExtra}
        />
      )}
    </div>
  );
}

export default FinancePage;
