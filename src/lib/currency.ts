export function getCurrencyConfig(locale: string) {
  if (locale === "pt") {
    return { numberLocale: "pt-PT", currency: "EUR" as const, symbol: "€" };
  }
  return { numberLocale: "en-US", currency: "USD" as const, symbol: "$" };
}

export function formatCurrency(
  amount: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
) {
  const { numberLocale, currency } = getCurrencyConfig(locale);
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function getCurrencySymbol(locale: string) {
  return getCurrencyConfig(locale).symbol;
}

/** Converts mock strings like "$450 - $750" to locale currency when on pt */
export function formatPriceString(text: string, locale: string) {
  if (!text.includes("$")) {
    return text;
  }

  if (locale !== "pt") {
    return text;
  }

  return text.replace(/\$([\d,]+)/g, (_, numStr) => {
    const amount = Number(numStr.replace(/,/g, ""));
    return formatCurrency(amount, locale);
  });
}
