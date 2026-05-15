import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

type ErrorsType = { [key: string]: string };

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    ownerName: "",
    property: "",
    unit: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const t = useTranslations("paymentTracking.recordPaymentModal");
  const tVal = useTranslations("paymentTracking.recordPaymentModal.validation");
  const tMethods = useTranslations("paymentTracking.paymentMethods");
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

  // Mock data for dropdowns
  const properties = [
    "Oceanview Towers",
    "Marina Heights",
    "Sunset Gardens",
    "Parkview Complex",
    "City Center Condos",
    "Riverside Plaza",
  ];



  // Mock owners data
  const owners = [
    { name: "Jennifer Martinez", property: "Oceanview Towers", unit: "4B" },
    { name: "Michael Chen", property: "Marina Heights", unit: "7A" },
    { name: "Sarah Williams", property: "Sunset Gardens", unit: "2C" },
    { name: "Robert Kim", property: "Parkview Complex", unit: "5B" },
    { name: "Lisa Thompson", property: "City Center Condos", unit: "1C" },
    { name: "David Wilson", property: "Riverside Plaza", unit: "8A" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ownerName: "",
        property: "",
        unit: "",
        amount: "",
        paymentMethod: "Bank Transfer",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Auto-populate property and unit when owner is selected
    if (field === "ownerName") {
      const selectedOwner = owners.find((owner) => owner.name === value);
      if (selectedOwner) {
        setFormData((prev) => ({
          ...prev,
          ownerName: value,
          property: selectedOwner.property,
          unit: selectedOwner.unit,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = tVal("ownerRequired");
    }

    if (!formData.property.trim()) {
      newErrors.property = tVal("propertyRequired");
    }

    if (!formData.unit.trim()) {
      newErrors.unit = tVal("unitRequired");
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSubmit(formData);
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
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-1001 p-4">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Owner <span className="text-error">*</span>
              </label>
              <select
                value={formData.ownerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange("ownerName", e.target.value)}
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.ownerName ? "border-error" : "border-border-medium"
                }`}
              >
                <option value="">{t("selectOwner")}</option>
                {owners.map((owner) => (
                  <option
                    key={`${owner.name}-${owner.unit}`}
                    value={owner.name}
                  >
                    {owner.name} - {owner.property} Unit {owner.unit}
                  </option>
                ))}
              </select>
              {errors.ownerName && (
                <p className="text-error text-xs mt-1">{errors.ownerName}</p>
              )}
            </div>

            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Property <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData.property}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange("property", e.target.value)}
                placeholder={t("propertyPlaceholder")}
                error={errors.property}
                disabled={!!formData.ownerName}
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Unit <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData.unit}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange("unit", e.target.value)}
                placeholder={t("unitPlaceholder")}
                error={errors.unit}
                disabled={!!formData.ownerName}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Amount <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                  $
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

            {/* {t("paymentMethod")} */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("paymentMethod")}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  handleInputChange("paymentMethod", e.target.value)
                }
                className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {paymentMethodKeys.map((key) => (
                  <option key={key} value={methodValues[key]}>
                    {tMethods(key)}
                  </option>
                ))}
              </select>
            </div>

            {/* {t("paymentDate")} */}
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

            {/* Notes */}
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

          {/* Amount Validation */}
          {formData.amount && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-100 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Info" size={16} className="text-primary" />
                <span className="text-sm text-primary font-medium">
                  Payment Amount:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(parseFloat(formData.amount) || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              iconName="Plus"
              className="w-full sm:w-auto"
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
