"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { CHARGE_KINDS, type AddChargeInput } from "@/lib/collections";
import { todayKey } from "@/lib/collections/dates";

type Props = {
  isOpen: boolean;
  ownerId: string;
  condominiumId?: string;
  onClose: () => void;
  onSubmit: (input: AddChargeInput) => Promise<boolean>;
};

function ChargeModal({
  isOpen,
  ownerId,
  condominiumId,
  onClose,
  onSubmit,
}: Props) {
  const t = useTranslations("currentAccount.chargeModal");
  const tKinds = useTranslations("currentAccount.kinds");
  const { currencySymbol } = useFormatCurrency();
  const [kind, setKind] = useState<(typeof CHARGE_KINDS)[number]>("charge");
  const [date, setDate] = useState(todayKey());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setKind("charge");
    setDate(todayKey());
    setDescription("");
    setAmount("");
    setErrors({});
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      next.amount = t("validation.amountRequired");
    }
    if (!description.trim()) {
      next.description = t("validation.descriptionRequired");
    }
    if (!date) {
      next.date = t("validation.dateRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const ok = await onSubmit({
      ownerId,
      condominiumId,
      kind,
      date,
      description: description.trim(),
      amount,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-text-secondary hover:text-text-primary transition-smooth disabled:opacity-50"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t("kind")}
            </label>
            <Select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as (typeof CHARGE_KINDS)[number])
              }
            >
              {CHARGE_KINDS.map((item) => (
                <option key={item} value={item}>
                  {tKinds(item)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t("date")} <span className="text-error">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setDate(event.target.value)
              }
            />
            {errors.date && (
              <p className="text-error text-xs mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t("description")} <span className="text-error">*</span>
            </label>
            <Input
              type="text"
              value={description}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(event.target.value)
              }
              placeholder={t("descriptionPlaceholder")}
            />
            {errors.description && (
              <p className="text-error text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t("amount")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                {currencySymbol}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                className="pl-8"
              />
            </div>
            {errors.amount && (
              <p className="text-error text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChargeModal;
