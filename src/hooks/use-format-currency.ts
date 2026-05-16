"use client";

import { useLocale } from "next-intl";
import {
  formatCurrency as formatCurrencyBase,
  formatPriceString,
  getCurrencySymbol,
} from "@/lib/currency";

export function useFormatCurrency() {
  const locale = useLocale();

  return {
    locale,
    formatCurrency: (
      amount: number,
      options?: Intl.NumberFormatOptions,
    ) => formatCurrencyBase(amount, locale, options),
    formatPriceString: (text: string) => formatPriceString(text, locale),
    currencySymbol: getCurrencySymbol(locale),
  };
}
