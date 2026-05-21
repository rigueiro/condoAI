"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type { PaymentMethod } from "../types";

interface BillingSectionProps {
  paymentMethod: PaymentMethod | null;
  billingEmail: string;
  onUpdateBillingEmail?: (email: string) => Promise<void> | void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const brandIcon = (brand: string): string => {
  switch (brand.toLowerCase()) {
    case "visa":
    case "mastercard":
    case "amex":
      return "CreditCard";
    default:
      return "CreditCard";
  }
};

function BillingSection({
  paymentMethod,
  billingEmail,
  onUpdateBillingEmail,
}: BillingSectionProps) {
  const t = useTranslations("account.billing");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(billingEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEmailValue(billingEmail);
    setEmailError(null);
    setEditingEmail(true);
  };

  const handleCancel = () => {
    setEditingEmail(false);
    setEmailError(null);
    setEmailValue(billingEmail);
  };

  const handleSave = async () => {
    const trimmed = emailValue.trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setEmailError(t("billingEmail"));
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateBillingEmail?.(trimmed);
      setEditingEmail(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">
          {t("paymentMethod")}
        </h3>

        {paymentMethod ? (
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border-light bg-secondary-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface bg-white border border-border-light flex items-center justify-center">
                <Icon
                  name={brandIcon(paymentMethod.brand)}
                  size={20}
                  color="var(--color-primary)"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {paymentMethod.brand}{" "}
                  {t("cardEnding", { last4: paymentMethod.last4 })}
                </p>
                <p className="text-xs text-text-secondary">
                  {t("expires", {
                    month: String(paymentMethod.expiryMonth).padStart(2, "0"),
                    year: paymentMethod.expiryYear,
                  })}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconName="Edit3"
            >
              {t("update")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-dashed border-border-medium">
            <div className="flex items-center gap-3 text-text-secondary">
              <Icon name="CreditCard" size={20} />
              <p className="text-sm">{t("noPaymentMethod")}</p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              iconName="Plus"
              className="text-white"
            >
              {t("addCard")}
            </Button>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-border-light">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-text-primary">
              {t("billingEmail")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {t("billingEmailDesc")}
            </p>
          </div>
          {!editingEmail && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconName="Edit3"
              onClick={handleEdit}
            >
              {t("edit")}
            </Button>
          )}
        </div>

        <div className="mt-3">
          {editingEmail ? (
            <div className="space-y-2">
              <input
                type="email"
                value={emailValue}
                onChange={(event) => {
                  setEmailValue(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                disabled={isSaving}
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
                  emailError ? "border-error" : "border-border-medium"
                }`}
              />
              {emailError && (
                <p className="text-xs text-error flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} />
                  <span>{emailError}</span>
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  loading={isSaving}
                  onClick={handleSave}
                  className="text-white"
                >
                  {t("save")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-primary font-medium">
              {billingEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BillingSection;
