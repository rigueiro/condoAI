"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const t = useTranslations("common.locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="locale-switcher" className="sr-only">
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="text-sm border border-border-medium rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
        aria-label={t("label")}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </div>
  );
}
