"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { todayKey } from "@/lib/collections/dates";
import {
  previewDebt,
  type AccountCharge,
  type AccountReceipt,
} from "@/lib/collections";
import {
  previewSaleTransfer,
  type TransferInput,
} from "@/lib/portfolio/transfer";
import type { Owner, QuotaPayment, Unit } from "@/types";
import type { OwnerRow } from "./types";

function TransferModal({
  seller,
  owners,
  units,
  quotas,
  charges,
  receipts,
  onClose,
  onTransfer,
}: {
  seller: OwnerRow;
  owners: Owner[];
  units: Unit[];
  quotas: QuotaPayment[];
  charges: AccountCharge[];
  receipts: AccountReceipt[];
  onClose: () => void;
  onTransfer: (input: TransferInput) => Promise<boolean>;
}) {
  const t = useTranslations("ownersManagement.transfer");
  const tRole = useTranslations("ownersManagement.roles");
  const tModal = useTranslations("ownersManagement.modal");
  const { formatCurrency } = useFormatCurrency();

  const ownerUnits = seller.occupancies.filter((row) => row.role === "owner");
  const [unitIds, setUnitIds] = useState<string[]>(
    () => ownerUnits.map((row) => row.unitId),
  );
  const [saleDate, setSaleDate] = useState(todayKey());
  const [buyerMode, setBuyerMode] = useState<"new" | "existing">("new");
  const [existingOwnerId, setExistingOwnerId] = useState("");
  const [fullName, setFullName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [issueCertificate, setIssueCertificate] = useState(true);
  const [settleSeller, setSettleSeller] = useState(true);
  const [handoffPortal, setHandoffPortal] = useState(true);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () => previewSaleTransfer(units, seller.owner.id, unitIds),
    [seller.owner.id, unitIds, units],
  );

  const debt = useMemo(
    () =>
      previewDebt(
        seller.owner.id,
        quotas,
        charges,
        receipts,
        saleDate || undefined,
      ),
    [charges, quotas, receipts, saleDate, seller.owner.id],
  );

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const owner of owners) map.set(owner.id, owner.fullName);
    return map;
  }, [owners]);

  const toggleUnit = (unitId: string) => {
    setUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return [...next];
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (unitIds.length === 0) next.units = t("validation.unitsRequired");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) {
      next.saleDate = t("validation.dateRequired");
    }
    if (buyerMode === "existing") {
      if (!existingOwnerId || existingOwnerId === seller.owner.id) {
        next.buyer = t("validation.buyerRequired");
      }
    } else if (!fullName.trim()) {
      next.buyer = t("validation.nameRequired");
    }
    const opening = parseFloat(openingBalance);
    if (openingBalance.trim() && (!Number.isFinite(opening) || opening < 0)) {
      next.openingBalance = t("validation.openingInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const buyer: TransferInput["buyer"] =
        buyerMode === "existing"
          ? { mode: "existing", ownerId: existingOwnerId }
          : {
              mode: "new",
              fullName: fullName.trim(),
              taxId: taxId.trim(),
              email: email.trim(),
              phone: phone.trim(),
            };
      const ok = await onTransfer({
        sellerId: seller.owner.id,
        unitIds,
        saleDate,
        buyer,
        issueCertificate,
        settleSeller,
        handoffPortal,
        openingBalance: openingBalance.trim() ? openingBalance : 0,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={tModal("cancel")}
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary disabled:opacity-50"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <p className={labelClass}>{t("fractions")}</p>
            <div className="space-y-2 rounded-lg border border-border-light px-3 py-2">
              {ownerUnits.length === 0 ? (
                <p className="text-sm text-text-secondary">{t("noOwnerUnits")}</p>
              ) : (
                ownerUnits.map((row) => (
                  <label
                    key={row.unitId}
                    className="flex items-center gap-2 text-sm text-text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={unitIds.includes(row.unitId)}
                      onChange={() => toggleUnit(row.unitId)}
                    />
                    <span>
                      {row.unitLabel} · {row.condominiumName}
                    </span>
                  </label>
                ))
              )}
            </div>
            {errors.units && (
              <p className="mt-1 text-xs text-error">{errors.units}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("saleDate")}</label>
            <input
              type="date"
              className={fieldClass}
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
            {errors.saleDate && (
              <p className="mt-1 text-xs text-error">{errors.saleDate}</p>
            )}
          </div>

          <div>
            <p className={labelClass}>{t("buyer")}</p>
            <div className="mb-2 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="buyerMode"
                  checked={buyerMode === "new"}
                  onChange={() => setBuyerMode("new")}
                />
                {t("newBuyer")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="buyerMode"
                  checked={buyerMode === "existing"}
                  onChange={() => setBuyerMode("existing")}
                />
                {t("existingBuyer")}
              </label>
            </div>
            {buyerMode === "existing" ? (
              <Select
                value={existingOwnerId}
                onChange={(e) => setExistingOwnerId(e.target.value)}
              >
                <option value="">{t("selectBuyer")}</option>
                {owners
                  .filter((item) => item.id !== seller.owner.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fullName}
                    </option>
                  ))}
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    className={fieldClass}
                    placeholder={t("fullName")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <input
                  className={fieldClass}
                  placeholder={t("taxId")}
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
                <input
                  className={fieldClass}
                  placeholder={t("phone")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  className={`${fieldClass} col-span-2`}
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            {errors.buyer && (
              <p className="mt-1 text-xs text-error">{errors.buyer}</p>
            )}
          </div>

          <div className="space-y-2 text-sm text-text-primary">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={issueCertificate}
                onChange={(e) => setIssueCertificate(e.target.checked)}
              />
              {t("issueCertificate")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settleSeller}
                onChange={(e) => setSettleSeller(e.target.checked)}
              />
              {t("settleSeller")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={handoffPortal}
                onChange={(e) => setHandoffPortal(e.target.checked)}
              />
              {t("handoffPortal")}
            </label>
          </div>

          <div>
            <label className={labelClass}>{t("openingBalance")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldClass}
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
            {errors.openingBalance && (
              <p className="mt-1 text-xs text-error">{errors.openingBalance}</p>
            )}
          </div>

          <div className="rounded-lg border border-border-light bg-secondary-50 px-3 py-3 text-xs text-text-secondary">
            <p className="mb-1 font-medium text-text-primary">{t("preview")}</p>
            <p>
              {t("previewDebt", { amount: formatCurrency(debt.total) })}
            </p>
            {preview.tenants.length > 0 && (
              <p className="mt-1">
                {t("previewTenants", {
                  names: preview.tenants
                    .map(
                      (row) =>
                        `${ownerNameById.get(row.ownerId) ?? row.ownerId} (${tRole(row.role)} · ${row.unitLabel})`,
                    )
                    .join(", "),
                })}
              </p>
            )}
            {preview.sellerRemainingOwnerUnits === 0 && unitIds.length > 0 && (
              <p className="mt-1">{t("previewExit")}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50 disabled:opacity-50"
            >
              {tModal("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || ownerUnits.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? t("transferring") : t("confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferModal;
