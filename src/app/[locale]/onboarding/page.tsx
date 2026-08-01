"use client";

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  AuthAlert,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import { isValidEmail, useAuth, useIsAuthenticated } from "@/lib/auth";
import {
  buildEmptyCondominium,
  buildImportTemplateCsv,
  usePortfolio,
  validateOwnersFractionsCsv,
  type ImportValidationResult,
} from "@/lib/portfolio";
import type { Organization } from "@/app/[locale]/account/types";

type OrgErrors = {
  name?: string;
  taxId?: string;
  email?: string;
};

type CondoErrors = {
  name?: string;
  street?: string;
  municipality?: string;
  taxId?: string;
  numberOfUnits?: string;
};

function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const {
    isReady,
    isDemo,
    needsOnboarding: mustOnboard,
    portfolio,
    saveOrganization,
    saveFirstCondominium,
    applyImport,
    completeOnboarding,
  } = usePortfolio();

  const initialStep =
    typeof portfolio.onboardingStep === "number"
      ? portfolio.onboardingStep
      : 1;
  const [step, setStep] = useState(initialStep);

  const [orgForm, setOrgForm] = useState({
    name: portfolio.organization?.name ?? "",
    legalName: portfolio.organization?.legalName ?? "",
    taxId: portfolio.organization?.taxId ?? "",
    email: portfolio.organization?.email ?? user?.email ?? "",
    phone: portfolio.organization?.phone ?? "",
  });
  const [orgErrors, setOrgErrors] = useState<OrgErrors>({});

  const existingCondo = portfolio.condominiums[0];
  const [condoForm, setCondoForm] = useState({
    name: existingCondo?.name ?? "",
    street: existingCondo?.address.street ?? "",
    postalCode: existingCondo?.address.postalCode ?? "",
    parish: existingCondo?.address.parish ?? "",
    municipality: existingCondo?.address.municipality ?? "",
    taxId: existingCondo?.taxId ?? "",
    numberOfUnits: existingCondo?.numberOfUnits
      ? String(existingCondo.numberOfUnits)
      : "",
  });
  const [condoErrors, setCondoErrors] = useState<CondoErrors>({});

  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [validation, setValidation] = useState<ImportValidationResult | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || !isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isDemo || !mustOnboard) {
      router.replace("/dashboard");
    }
  }, [
    authLoading,
    isReady,
    isAuthenticated,
    isDemo,
    mustOnboard,
    router,
  ]);

  useEffect(() => {
    if (typeof portfolio.onboardingStep === "number") {
      setStep(portfolio.onboardingStep);
    }
  }, [portfolio.onboardingStep]);

  const stepLabels = useMemo(
    () => [
      t("steps.organization"),
      t("steps.condominium"),
      t("steps.import"),
    ],
    [t],
  );

  const resolveErrorMessage = (code: string) => {
    switch (code) {
      case "required":
        return t("import.errorRequired");
      case "invalidEmail":
        return t("import.errorInvalidEmail");
      case "invalidNumber":
        return t("import.errorInvalidNumber");
      case "missingHeader":
        return t("import.errorMissingHeader");
      case "emptyFile":
        return t("import.errorEmptyFile");
      default:
        return code;
    }
  };

  const handleOrgChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrgForm((prev) => ({ ...prev, [name]: value }));
    setOrgErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCondoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCondoForm((prev) => ({ ...prev, [name]: value }));
    setCondoErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submitOrg = (e: FormEvent) => {
    e.preventDefault();
    const next: OrgErrors = {};
    if (!orgForm.name.trim()) next.name = t("org.nameRequired");
    if (!orgForm.taxId.trim()) next.taxId = t("org.taxIdRequired");
    if (!orgForm.email.trim()) next.email = t("org.emailRequired");
    else if (!isValidEmail(orgForm.email)) next.email = t("org.emailInvalid");
    setOrgErrors(next);
    if (Object.keys(next).length > 0) return;

    const organization: Organization = {
      name: orgForm.name.trim(),
      legalName: orgForm.legalName.trim() || orgForm.name.trim(),
      taxId: orgForm.taxId.trim(),
      email: orgForm.email.trim(),
      phone: orgForm.phone.trim(),
      website: "",
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "PT",
    };
    saveOrganization(organization);
    setStep(2);
  };

  const submitCondo = (e: FormEvent) => {
    e.preventDefault();
    const units = Number(condoForm.numberOfUnits);
    const next: CondoErrors = {};
    if (!condoForm.name.trim()) next.name = t("condo.nameRequired");
    if (!condoForm.street.trim()) next.street = t("condo.streetRequired");
    if (!condoForm.municipality.trim())
      next.municipality = t("condo.municipalityRequired");
    if (!condoForm.taxId.trim()) next.taxId = t("condo.taxIdRequired");
    if (!Number.isFinite(units) || units < 1)
      next.numberOfUnits = t("condo.unitsRequired");
    setCondoErrors(next);
    if (Object.keys(next).length > 0) return;

    saveFirstCondominium(
      buildEmptyCondominium({
        name: condoForm.name,
        street: condoForm.street,
        postalCode: condoForm.postalCode,
        parish: condoForm.parish,
        municipality: condoForm.municipality,
        taxId: condoForm.taxId,
        numberOfUnits: units,
      }),
    );
    setStep(3);
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildImportTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "owners-fractions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = async (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportError(t("import.csvOnly"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError(t("import.fileTooLarge"));
      return;
    }

    const condoId = portfolio.condominiums[0]?.id;
    if (!condoId) {
      setImportError(t("condo.nameRequired"));
      return;
    }

    setImportError(null);
    setIsProcessing(true);
    try {
      const text = await file.text();
      setValidation(validateOwnersFractionsCsv(text, condoId));
    } finally {
      setIsProcessing(false);
    }
  };

  const finish = (withImport: boolean) => {
    setIsFinishing(true);
    if (withImport && validation && validation.validRows > 0) {
      applyImport(validation.units, validation.owners);
    }
    completeOnboarding();
    router.push("/dashboard");
  };

  if (authLoading || !isReady || !isAuthenticated || isDemo || !mustOnboard) {
    return (
      <AuthShell wide>
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">{t("redirecting")}</p>
        </div>
      </AuthShell>
    );
  }

  const inputClass =
    "w-full px-4 py-3 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth";

  return (
    <AuthShell
      wide
      footer={
        <p className="text-center text-sm text-text-secondary mt-6">
          {t("subtitle")}
        </p>
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary text-center mb-6">
          {t("title")}
        </h1>
        <div className="flex items-center justify-between gap-2">
          {stepLabels.map((label, index) => {
            const n = index + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex-1 text-center">
                <div
                  className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${
                    done || active
                      ? "bg-primary text-white"
                      : "bg-secondary-100 text-text-secondary"
                  }`}
                >
                  {done ? <Icon name="Check" size={16} /> : n}
                </div>
                <p
                  className={`text-xs ${
                    active ? "text-text-primary font-medium" : "text-text-secondary"
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={submitOrg} className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("org.title")}
            </h2>
            <p className="text-sm text-text-secondary">{t("org.subtitle")}</p>
          </div>
          <Field
            label={t("org.name")}
            name="name"
            value={orgForm.name}
            onChange={handleOrgChange}
            error={orgErrors.name}
            className={inputClass}
          />
          <Field
            label={t("org.legalName")}
            name="legalName"
            value={orgForm.legalName}
            onChange={handleOrgChange}
            className={inputClass}
          />
          <Field
            label={t("org.taxId")}
            name="taxId"
            value={orgForm.taxId}
            onChange={handleOrgChange}
            error={orgErrors.taxId}
            className={inputClass}
          />
          <Field
            label={t("org.email")}
            name="email"
            type="email"
            value={orgForm.email}
            onChange={handleOrgChange}
            error={orgErrors.email}
            className={inputClass}
          />
          <Field
            label={t("org.phone")}
            name="phone"
            value={orgForm.phone}
            onChange={handleOrgChange}
            className={inputClass}
          />
          <AuthSubmitButton
            busy={false}
            busyLabel={t("org.continue")}
            label={t("org.continue")}
            icon="ArrowRight"
          />
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submitCondo} className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("condo.title")}
            </h2>
            <p className="text-sm text-text-secondary">{t("condo.subtitle")}</p>
          </div>
          <Field
            label={t("condo.name")}
            name="name"
            value={condoForm.name}
            onChange={handleCondoChange}
            error={condoErrors.name}
            className={inputClass}
          />
          <Field
            label={t("condo.street")}
            name="street"
            value={condoForm.street}
            onChange={handleCondoChange}
            error={condoErrors.street}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("condo.postalCode")}
              name="postalCode"
              value={condoForm.postalCode}
              onChange={handleCondoChange}
              className={inputClass}
            />
            <Field
              label={t("condo.parish")}
              name="parish"
              value={condoForm.parish}
              onChange={handleCondoChange}
              className={inputClass}
            />
          </div>
          <Field
            label={t("condo.municipality")}
            name="municipality"
            value={condoForm.municipality}
            onChange={handleCondoChange}
            error={condoErrors.municipality}
            className={inputClass}
          />
          <Field
            label={t("condo.taxId")}
            name="taxId"
            value={condoForm.taxId}
            onChange={handleCondoChange}
            error={condoErrors.taxId}
            className={inputClass}
          />
          <Field
            label={t("condo.numberOfUnits")}
            name="numberOfUnits"
            type="number"
            value={condoForm.numberOfUnits}
            onChange={handleCondoChange}
            error={condoErrors.numberOfUnits}
            className={inputClass}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setStep(1)}
            >
              {t("condo.back")}
            </Button>
            <AuthSubmitButton
              busy={false}
              busyLabel={t("condo.continue")}
              label={t("condo.continue")}
              icon="ArrowRight"
            />
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {t("import.title")}
            </h2>
            <p className="text-sm text-text-secondary">{t("import.subtitle")}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            iconName="Download"
            onClick={downloadTemplate}
          >
            {t("import.downloadTemplate")}
          </Button>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth ${
              dragActive
                ? "border-primary bg-primary-50"
                : "border-border-medium hover:border-primary"
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void processFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon
              name="Upload"
              size={32}
              color="var(--color-secondary)"
              className="mx-auto mb-3"
            />
            <p className="text-sm text-text-secondary">{t("import.dropHint")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processFile(file);
              }}
            />
          </div>

          {importError && <AuthAlert>{importError}</AuthAlert>}
          {isProcessing && (
            <p className="text-sm text-text-secondary text-center">
              {t("import.processing")}
            </p>
          )}

          {validation && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="text-success">
                  {t("import.validRows", { count: validation.validRows })}
                </span>
                {validation.invalidRows > 0 && (
                  <span className="text-error">
                    {t("import.invalidRows", {
                      count: validation.invalidRows,
                    })}
                  </span>
                )}
              </div>

              {validation.warnings.includes("permillageSum") && (
                <div className="bg-warning-50 border border-warning-100 rounded-lg p-3 text-sm text-warning">
                  {t("import.permillageWarning", {
                    sum: validation.preview
                      .reduce((s, r) => s + r.permillage, 0)
                      .toFixed(1),
                  })}
                </div>
              )}

              {validation.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">
                    {t("import.errorsTitle")}
                  </p>
                  <ul className="text-xs text-error space-y-1 max-h-32 overflow-y-auto">
                    {validation.errors.slice(0, 8).map((err, i) => (
                      <li key={`${err.row}-${err.field}-${i}`}>
                        Row {err.row} · {err.field}:{" "}
                        {resolveErrorMessage(err.message)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.preview.length > 0 && (
                <div className="overflow-x-auto border border-border-light rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary-50 text-text-secondary">
                      <tr>
                        <th className="px-2 py-2 text-left">
                          {t("import.columns.unitLabel")}
                        </th>
                        <th className="px-2 py-2 text-left">
                          {t("import.columns.ownerName")}
                        </th>
                        <th className="px-2 py-2 text-left">
                          {t("import.columns.email")}
                        </th>
                        <th className="px-2 py-2 text-right">
                          {t("import.columns.permillage")}
                        </th>
                        <th className="px-2 py-2 text-right">
                          {t("import.columns.monthlyQuota")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.slice(0, 5).map((row) => (
                        <tr
                          key={`${row.unitLabel}-${row.ownerTaxId}`}
                          className="border-t border-border-light"
                        >
                          <td className="px-2 py-2">{row.unitLabel}</td>
                          <td className="px-2 py-2">{row.ownerName}</td>
                          <td className="px-2 py-2">{row.email}</td>
                          <td className="px-2 py-2 text-right">
                            {row.permillage}
                          </td>
                          <td className="px-2 py-2 text-right">
                            {row.monthlyQuota}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setStep(2)}
                disabled={isFinishing}
              >
                {t("import.back")}
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={isFinishing}
                disabled={
                  isFinishing ||
                  !validation ||
                  validation.validRows === 0
                }
                onClick={() => finish(true)}
              >
                {isFinishing ? t("import.importing") : t("import.finish")}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              disabled={isFinishing}
              onClick={() => finish(false)}
            >
              {t("import.skip")}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  className,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary mb-2"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`${className} ${error ? "border-error" : ""}`}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}

export default OnboardingPage;
