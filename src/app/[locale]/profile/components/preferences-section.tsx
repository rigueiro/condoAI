"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Theme = "light" | "dark" | "system";

interface SelectFieldProps {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({
  id,
  label,
  description,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary block"
        >
          {label}
        </label>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm rounded-lg border border-border-medium bg-surface px-3 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent sm:min-w-[180px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PreferencesSection() {
  const t = useTranslations("profile.preferences");
  const tLocale = useTranslations("common.locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>("system");
  const [currency, setCurrency] = useState("EUR");
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale as Locale });
  };

  return (
    <div className="divide-y divide-border-light">
      <SelectField
        id="pref-language"
        label={t("language")}
        description={t("languageDesc")}
        value={locale}
        onChange={handleLocaleChange}
        options={routing.locales.map((loc) => ({
          value: loc,
          label: tLocale(loc),
        }))}
      />

      <SelectField
        id="pref-theme"
        label={t("theme")}
        description={t("themeDesc")}
        value={theme}
        onChange={(value) => setTheme(value as Theme)}
        options={[
          { value: "light", label: t("themeLight") },
          { value: "dark", label: t("themeDark") },
          { value: "system", label: t("themeSystem") },
        ]}
      />

      <SelectField
        id="pref-currency"
        label={t("currency")}
        description={t("currencyDesc")}
        value={currency}
        onChange={setCurrency}
        options={[
          { value: "EUR", label: "EUR (€)" },
          { value: "USD", label: "USD ($)" },
          { value: "GBP", label: "GBP (£)" },
          { value: "BRL", label: "BRL (R$)" },
        ]}
      />

      <SelectField
        id="pref-date-format"
        label={t("dateFormat")}
        description={t("dateFormatDesc")}
        value={dateFormat}
        onChange={setDateFormat}
        options={[
          { value: "dd/MM/yyyy", label: "31/12/2026" },
          { value: "MM/dd/yyyy", label: "12/31/2026" },
          { value: "yyyy-MM-dd", label: "2026-12-31" },
        ]}
      />
    </div>
  );
}

export default PreferencesSection;
