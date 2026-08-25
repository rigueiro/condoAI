/** Calendar helpers for quota month keys (YYYY-MM). */

export function monthYearFromDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthYear(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthYearFromDate(d);
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatIsoDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
): string {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString(locale, options);
}

export function formatMonthYear(monthYear: string, locale: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  if (!year || !month) return monthYear;
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}
