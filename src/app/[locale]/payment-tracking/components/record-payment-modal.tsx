import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useCollections, type RecordPaymentInput } from "@/lib/collections";

type ErrorsType = { [key: string]: string };

export type RecordPaymentInitialValues = {
  ownerId?: string;
  amount?: number | string;
  notes?: string;
};

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordPaymentInput) => void | Promise<void>;

  initialValues?: RecordPaymentInitialValues | null;
}

function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    ownerId: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const t = useTranslations("paymentTracking.recordPaymentModal");
  const tVal = useTranslations("paymentTracking.recordPaymentModal.validation");
  const tMethods = useTranslations("paymentTracking.paymentMethods");
  const { formatCurrency, currencySymbol } = useFormatCurrency();
  const { ownersWithBalances } = useCollections();
  const [errors, setErrors] = useState<ErrorsType>({});

  const paymentMethodKeys = [
    "bankTransfer",
    "creditCard",
    "check",
    "cash",
    "onlinePayment",
  ] as const;
  const methodValues: Record<(typeof paymentMethodKeys)[number], string> = {
    bankTransfer: "Bank Transfer",
    creditCard: "Credit Card",
    check: "Check",
    cash: "Cash",
    onlinePayment: "Online Payment",
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOwner = ownersWithBalances.find(
    (o) => o.owner.id === formData.ownerId,
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ownerId: initialValues?.ownerId ?? "",
        amount:
          initialValues?.amount != null && initialValues.amount !== ""
            ? String(initialValues.amount)
            : "",
        paymentMethod: "Bank Transfer",
        notes: initialValues?.notes ?? "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!formData.ownerId) {
      newErrors.ownerId = tVal("ownerRequired");
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = tVal("amountRequired");
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = tVal("dateRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ownerId: formData.ownerId,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        paymentDate: formData.paymentDate,
      });
    } catch (error) {
      console.error("Error recording payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-text-secondary hover:text-text-primary transition-smooth disabled:opacity-50"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("owner")} <span className="text-error">*</span>
              </label>
              <Select
                value={formData.ownerId}
                onChange={(e) => handleInputChange("ownerId", e.target.value)}
                invalid={Boolean(errors.ownerId)}
              >
                <option value="">{t("selectOwner")}</option>
                {ownersWithBalances.map((row) => (
                  <option key={row.owner.id} value={row.owner.id}>
                    {row.owner.fullName} - {row.condominiumName} Unit{" "}
                    {row.unitLabel}
                  </option>
                ))}
              </Select>
              {errors.ownerId && (
                <p className="text-error text-xs mt-1">{errors.ownerId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("property")}
              </label>
              <Input
                type="text"
                value={selectedOwner?.condominiumName ?? ""}
                disabled
                placeholder={t("selectProperty")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("unit")}
              </label>
              <Input
                type="text"
                value={selectedOwner?.unitLabel ?? ""}
                disabled
                placeholder={t("unitPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("amount")} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange("amount", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  error={errors.amount}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("paymentMethod")}
              </label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) =>
                  handleInputChange("paymentMethod", e.target.value)
                }
              >
                {paymentMethodKeys.map((key) => (
                  <option key={key} value={methodValues[key]}>
                    {tMethods(key)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("paymentDate")} <span className="text-error">*</span>
              </label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  handleInputChange("paymentDate", e.target.value)
                }
                error={errors.paymentDate}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {formData.amount && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Info" size={16} className="text-primary" />
                <span className="text-sm text-primary font-medium">
                  {t("paymentAmountPreview", {
                    amount: formatCurrency(parseFloat(formData.amount) || 0, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              iconName="Plus"
              className="w-full sm:w-auto text-white"
            >
              {isSubmitting ? t("recording") : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordPaymentModal;
