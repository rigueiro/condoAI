"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { AnnualBudget, BankAccount, Expense } from "@/types";
import {
  normalizeAnnualBudget,
  summarizeBudget,
  type FinanceKind,
} from "@/lib/finance";
import { useOperations, VendorSelectField } from "@/lib/operations";

export type FinanceRecord =
  | { kind: "budget"; data: AnnualBudget }
  | { kind: "expense"; data: Expense }
  | { kind: "bank"; data: BankAccount };

type CondoOption = { id: string; name: string };

type Errors = Record<string, string>;

function categoriesToText(values: Record<string, number>): string {
  return Object.entries(values)
    .map(([key, amount]) => `${key}: ${amount}`)
    .join("\n");
}

function parseCategories(text: string): Record<string, number> | null {
  const result: Record<string, number> = {};
  const lines = text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  for (const line of lines) {
    const match = line.match(/^([^:=]+)[:=]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!match) return null;
    const key = match[1].trim();
    const amount = Number(match[2]);
    if (!key || Number.isNaN(amount)) return null;
    result[key] = amount;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function FinanceModal({
  record,
  defaultKind,
  condominiums,
  defaultCondominiumId,
  onClose,
  onSave,
}: {
  record: FinanceRecord | null;
  defaultKind: FinanceKind;
  condominiums: CondoOption[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onSave: (record: FinanceRecord) => void;
}) {
  const t = useTranslations("finance");
  const { formatCurrency } = useFormatCurrency();
  const { vendors } = useOperations();
  const isEdit = Boolean(record);
  const initialBudget =
    record?.kind === "budget" ? normalizeAnnualBudget(record.data) : null;
  const [kind, setKind] = useState<FinanceKind>(record?.kind ?? defaultKind);
  const [condominiumId, setCondominiumId] = useState(
    record?.data.condominiumId ??
      defaultCondominiumId ??
      condominiums[0]?.id ??
      "",
  );
  const [year, setYear] = useState(
    initialBudget ? String(initialBudget.year) : String(new Date().getFullYear()),
  );
  const [status, setStatus] = useState<AnnualBudget["status"]>(
    initialBudget ? initialBudget.status : "draft",
  );
  const [categoriesText, setCategoriesText] = useState(
    initialBudget
      ? categoriesToText(initialBudget.valuesByCategory)
      : "cleaning: 0\nelectricity: 0\ninsurance: 0\nmaintenance: 0",
  );
  const [reserveFund, setReserveFund] = useState(
    initialBudget ? String(initialBudget.reserveFund) : "",
  );
  const [expenseDate, setExpenseDate] = useState(
    record?.kind === "expense" ? String(record.data.date).slice(0, 10) : "",
  );
  const [amount, setAmount] = useState(
    record?.kind === "expense" ? String(record.data.amount) : "",
  );
  const [category, setCategory] = useState(
    record?.kind === "expense" ? record.data.category : "",
  );
  const [supplier, setSupplier] = useState(
    record?.kind === "expense" ? record.data.supplier : "",
  );
  const [vendorId, setVendorId] = useState(
    record?.kind === "expense" ? (record.data.vendorId ?? "") : "",
  );
  const [bank, setBank] = useState(
    record?.kind === "bank" ? record.data.bank : "",
  );
  const [iban, setIban] = useState(
    record?.kind === "bank" ? record.data.iban : "",
  );
  const [balance, setBalance] = useState(
    record?.kind === "bank" ? String(record.data.currentBalance) : "",
  );
  const [errors, setErrors] = useState<Errors>({});

  const budgetPreview = useMemo(() => {
    const parsed = parseCategories(categoriesText);
    if (!parsed) return null;
    const reserve = Number(reserveFund);
    const summary = summarizeBudget({
      valuesByCategory: parsed,
      reserveFund: Number.isFinite(reserve) ? reserve : 0,
    });
    return Object.keys(summary.ordinary).length > 0 ? summary : null;
  }, [categoriesText, reserveFund]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!condominiumId) {
      next.condominiumId = t("modal.validation.condominiumRequired");
    }

    if (kind === "budget") {
      if (!year.trim() || Number.isNaN(Number(year))) {
        next.year = t("modal.validation.yearRequired");
      }
      if (!budgetPreview) {
        next.categories = t("modal.validation.categoriesRequired");
      }
      const reserve = Number(reserveFund);
      if (!reserveFund.trim() || !Number.isFinite(reserve) || reserve < 0) {
        next.reserveFund = t("modal.validation.reserveRequired");
      }
    } else if (kind === "expense") {
      if (!expenseDate) next.expenseDate = t("modal.validation.dateRequired");
      if (!amount.trim() || Number.isNaN(Number(amount))) {
        next.amount = t("modal.validation.amountRequired");
      }
      if (!category.trim()) {
        next.category = t("modal.validation.categoryRequired");
      }
      if (!vendorId && !supplier.trim()) {
        next.supplier = t("modal.validation.supplierRequired");
      }
    } else {
      if (!bank.trim()) next.bank = t("modal.validation.bankRequired");
      if (!iban.trim()) next.iban = t("modal.validation.ibanRequired");
      if (!balance.trim() || Number.isNaN(Number(balance))) {
        next.balance = t("modal.validation.balanceRequired");
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = record?.data.id ?? crypto.randomUUID();

    if (kind === "budget") {
      if (!budgetPreview) return;
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          year: Number(year),
          valuesByCategory: budgetPreview.ordinary,
          reserveFund: Number(reserveFund),
          status,
        },
      });
      return;
    }

    if (kind === "expense") {
      onSave({
        kind,
        data: {
          id,
          condominiumId,
          date: expenseDate,
          amount: Number(amount),
          category: category.trim(),
          supplier: supplier.trim(),
          vendorId: vendorId || null,
          invoice: record?.kind === "expense" ? record.data.invoice : null,
        },
      });
      return;
    }

    onSave({
      kind,
      data: {
        id,
        condominiumId,
        bank: bank.trim(),
        iban: iban.trim(),
        currentBalance: Number(balance),
      },
    });
  };

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("modal.cancel")}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit
              ? t("modal.editTitle", { kind: t(`kinds.${kind}`) })
              : t("modal.addTitle", { kind: t(`kinds.${kind}`) })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {!isEdit && (
            <div>
              <label className={labelClass}>{t("modal.kind")}</label>
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as FinanceKind)}
              >
                <option value="budget">{t("kinds.budget")}</option>
                <option value="expense">{t("kinds.expense")}</option>
                <option value="bank">{t("kinds.bank")}</option>
              </Select>
            </div>
          )}

          <div>
            <label className={labelClass}>{t("modal.condominium")}</label>
            <Select
              value={condominiumId}
              onChange={(e) => {
                setCondominiumId(e.target.value);
                setVendorId("");
              }}
            >
              {condominiums.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.condominiumId && (
              <p className="mt-1 text-xs text-error">{errors.condominiumId}</p>
            )}
          </div>

          {kind === "budget" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("modal.year")}</label>
                  <input
                    type="number"
                    className={fieldClass}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                  {errors.year && (
                    <p className="mt-1 text-xs text-error">{errors.year}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{t("modal.status")}</label>
                  <Select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as AnnualBudget["status"])
                    }
                  >
                    <option value="draft">{t("status.draft")}</option>
                    <option value="approved">{t("status.approved")}</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("modal.categories")}</label>
                <textarea
                  className={`${fieldClass} min-h-32 font-mono text-xs`}
                  value={categoriesText}
                  onChange={(e) => setCategoriesText(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-secondary">
                  {t("modal.categoriesHint")}
                </p>
                {budgetPreview?.hadReserveKeys && (
                  <p className="mt-1 text-xs text-warning">
                    {t("modal.reserveIgnored")}
                  </p>
                )}
                {errors.categories && (
                  <p className="mt-1 text-xs text-error">{errors.categories}</p>
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-text-primary">
                    {t("modal.reserveFund")}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:text-primary-600 disabled:text-text-secondary"
                    disabled={!budgetPreview}
                    onClick={() => {
                      if (!budgetPreview) return;
                      setReserveFund(String(budgetPreview.minimumReserve));
                    }}
                  >
                    {t("modal.useMinimumReserve")}
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  value={reserveFund}
                  onChange={(e) => setReserveFund(e.target.value)}
                />
                <p className="mt-1 text-xs text-text-secondary">
                  {t("modal.reserveHint")}
                </p>
                {errors.reserveFund && (
                  <p className="mt-1 text-xs text-error">{errors.reserveFund}</p>
                )}
              </div>
              {budgetPreview && (
                <div className="space-y-1 rounded-lg border border-border-light bg-secondary-50 px-3 py-3 text-sm">
                  <div className="flex justify-between gap-3 text-text-secondary">
                    <span>{t("modal.ordinaryTotal")}</span>
                    <span>{formatCurrency(budgetPreview.ordinaryTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-text-secondary">
                    <span>{t("modal.minimumReserve")}</span>
                    <span>{formatCurrency(budgetPreview.minimumReserve)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-text-primary">
                    <span>{t("modal.reserveFund")}</span>
                    <span>{formatCurrency(budgetPreview.reserveFund)}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border-light pt-1 font-medium text-text-primary">
                    <span>{t("modal.annualTotal")}</span>
                    <span>{formatCurrency(budgetPreview.collectable)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-text-secondary">
                    <span>{t("modal.monthlyTotal")}</span>
                    <span>{formatCurrency(budgetPreview.monthlyTotal)}</span>
                  </div>
                  {budgetPreview.shortfall > 0 && (
                    <p className="pt-1 text-xs text-warning">
                      {t("modal.reserveWarning", {
                        amount: formatCurrency(budgetPreview.shortfall),
                      })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {kind === "expense" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("modal.date")}</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                  {errors.expenseDate && (
                    <p className="mt-1 text-xs text-error">
                      {errors.expenseDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{t("modal.amount")}</label>
                  <input
                    type="number"
                    className={fieldClass}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs text-error">{errors.amount}</p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("modal.category")}</label>
                <input
                  className={fieldClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                {errors.category && (
                  <p className="mt-1 text-xs text-error">{errors.category}</p>
                )}
              </div>
              <VendorSelectField
                vendors={vendors}
                condominiumId={condominiumId}
                value={vendorId}
                onChange={(nextId, vendor) => {
                  setVendorId(nextId);
                  if (vendor) setSupplier(vendor.name);
                }}
                label={t("modal.vendor")}
                emptyOptionLabel={t("modal.noVendorSelected")}
                noVendorsMessage={t("modal.noVendors")}
                labelClassName={labelClass}
              />
              <div>
                <label className={labelClass}>{t("modal.supplier")}</label>
                <input
                  className={fieldClass}
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder={t("modal.supplierPlaceholder")}
                />
                {errors.supplier && (
                  <p className="mt-1 text-xs text-error">{errors.supplier}</p>
                )}
                <p className="mt-1 text-xs text-text-secondary">
                  {t("modal.supplierHint")}
                </p>
              </div>
            </>
          )}

          {kind === "bank" && (
            <>
              <div>
                <label className={labelClass}>{t("modal.bank")}</label>
                <input
                  className={fieldClass}
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                />
                {errors.bank && (
                  <p className="mt-1 text-xs text-error">{errors.bank}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.iban")}</label>
                <input
                  className={fieldClass}
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                />
                {errors.iban && (
                  <p className="mt-1 text-xs text-error">{errors.iban}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("modal.balance")}</label>
                <input
                  type="number"
                  className={fieldClass}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
                {errors.balance && (
                  <p className="mt-1 text-xs text-error">{errors.balance}</p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              {t("modal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinanceModal;
