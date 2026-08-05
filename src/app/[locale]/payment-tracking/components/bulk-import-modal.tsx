import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import useSWR from "swr";
import { fetcher } from "@/app/mocks/mocks-utils";

interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: { row: number; field: string; message: string }[];
  preview: {
    ownerName: string;
    property: string;
    unit: string;
    amount: number;
    date: string;
    method: string;
  }[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { file: File; validationResults: ValidationResult }) => void;
}

function BulkImportModal({ isOpen, onClose, onSubmit }: BulkImportModalProps) {
  const t = useTranslations("paymentTracking.bulkImportModal");
  const { formatCurrency } = useFormatCurrency();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] =
    useState<ValidationResult | null>(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Validate, 3: Confirm
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO const { data, error } = useSWR("/api/payment/", fetcher);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert(t("csvOnly"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert(t("fileTooLarge"));
      return;
    }

    setUploadedFile(file);
    validateFile(file);
  };

  const validateFile = async (_file: File) => {
    setIsProcessing(true);
    setStep(2);

    // Simulate file validation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock validation results
    const mockResults = {
      totalRows: 25,
      validRows: 23,
      invalidRows: 2,
      errors: [
        { row: 5, field: "amount", message: t("validation.invalidAmount") },
        { row: 12, field: "date", message: t("validation.invalidDate") },
      ],
      preview: [
        {
          ownerName: "Ana Sofia Martins",
          property: "Condomínio Jardins da Amoreira",
          unit: "A-101",
          amount: 2500,
          date: "2024-01-15",
          method: "Bank Transfer",
        },
        {
          ownerName: "João Pedro Fernandes",
          property: "Edifício Torre do Tejo",
          unit: "B-205",
          amount: 2400,
          date: "2024-01-15",
          method: "Credit Card",
        },
        {
          ownerName: "Maria Clara Rodrigues",
          property: "Condomínio Jardins da Amoreira",
          unit: "C-302",
          amount: 2000,
          date: "2024-01-15",
          method: "Check",
        },
      ],
    };

    setValidationResults(mockResults);
    setIsProcessing(false);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !validationResults) return;

    setIsProcessing(true);

    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onSubmit({
        file: uploadedFile,
        validationResults,
      });
    } catch (error) {
      console.error("Error processing bulk import:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStep(1);
      setUploadedFile(null);
      setValidationResults(null);
      setDragActive(false);
      onClose();
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Owner Name,Property,Unit,Amount,Payment Date,Payment Method,Notes\n" +
      "Ana Sofia Martins,Condomínio Jardins da Amoreira,A-101,2500,2024-01-15,Bank Transfer,Monthly fee\n" +
      "João Pedro Fernandes,Edifício Torre do Tejo,B-205,2400,2024-01-15,Credit Card,Monthly fee";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payment_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4">
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
            disabled={isProcessing}
            className="p-2 text-text-secondary hover:text-text-primary transition-smooth disabled:opacity-50"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-secondary-25 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-2 ${step >= 1 ? "text-primary" : "text-text-secondary"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= 1
                    ? "bg-primary text-white"
                    : "bg-secondary-200 text-text-secondary"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">{t("stepUpload")}</span>
            </div>
            <div
              className={`w-16 h-0.5 ${step >= 2 ? "bg-primary" : "bg-secondary-200"}`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${step >= 2 ? "text-primary" : "text-text-secondary"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= 2
                    ? "bg-primary text-white"
                    : "bg-secondary-200 text-text-secondary"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">{t("stepValidate")}</span>
            </div>
            <div
              className={`w-16 h-0.5 ${step >= 3 ? "bg-primary" : "bg-secondary-200"}`}
            ></div>
            <div
              className={`flex items-center space-x-2 ${step >= 3 ? "text-primary" : "text-text-secondary"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= 3
                    ? "bg-primary text-white"
                    : "bg-secondary-200 text-text-secondary"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">{t("stepImport")}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="Info" size={20} className="text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-primary mb-1">
                      {t("csvRequiredTitle")}
                    </h3>
                    <p className="text-sm text-primary mb-3">
                      Use our template to ensure proper formatting. Required
                      columns: Owner Name, Property, Unit, Amount, Payment Date,
                      Payment Method.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      iconName="Download"
                      onClick={downloadTemplate}
                    >
                      {t("downloadTemplate")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? "border-primary bg-primary-50"
                    : "border-border-medium hover:border-primary hover:bg-primary-25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <Icon name="Upload" size={32} className="text-primary" />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {t("dropTitle")}
                    </h3>
                    <p className="text-text-secondary mb-4">
                      {t("dropSubtitle")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t("selectFile")}
                    </Button>
                  </div>

                  <div className="text-xs text-text-secondary">
                    {t("fileHint")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  {t("validatingTitle")}
                </h3>
                <p className="text-text-secondary">
                  {t("validatingDesc")}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review and Import */}
          {step === 3 && validationResults && (
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-border-light rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {validationResults.totalRows}
                  </div>
                  <div className="text-sm text-text-secondary">{t("totalRows")}</div>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-success">
                    {validationResults.validRows}
                  </div>
                  <div className="text-sm text-success-700">{t("validRows")}</div>
                </div>
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-error">
                    {validationResults.invalidRows}
                  </div>
                  <div className="text-sm text-error-700">{t("invalidRows")}</div>
                </div>
              </div>

              {/* Errors */}
              {validationResults.errors.length > 0 && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <h4 className="font-medium text-error mb-3 flex items-center">
                    <Icon name="AlertTriangle" size={16} className="mr-2" />
                    {t("validationErrors")}
                  </h4>
                  <div className="space-y-2">
                    {validationResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-error-700">
                        {t("errorRow", { row: error.row, message: error.message, field: error.field })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-surface border border-border-light rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-secondary-50 border-b border-border-light">
                  <h4 className="font-medium text-text-primary">
                    {t("previewTitle")}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-secondary-25">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Owner
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Property
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {validationResults.preview.map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {row.ownerName}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {row.property}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {row.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {row.date}
                          </td>
                          <td className="px-4 py-2 text-sm text-text-primary">
                            {row.method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            {step === 1 && uploadedFile && (
              <Button
                onClick={() => validateFile(uploadedFile)}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            )}

            {step === 3 && validationResults && (
              <Button
                onClick={handleSubmit}
                loading={isProcessing}
                iconName="Upload"
                className="w-full sm:w-auto"
                disabled={validationResults.validRows === 0}
              >
                {isProcessing
                  ? t("importing")
                  : t("importPayments", { count: validationResults.validRows })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkImportModal;
