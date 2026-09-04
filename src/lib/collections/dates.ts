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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function addCalendarMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate();
  const nextDay = Math.min(day, lastDay);
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = fromIso.slice(0, 10).split("-").map(Number);
  const to = toIso.slice(0, 10).split("-").map(Number);
  if (from.length < 3 || to.length < 3) return 0;
  const start = Date.UTC(from[0], from[1] - 1, from[2]);
  const end = Date.UTC(to[0], to[1] - 1, to[2]);
  return Math.max(0, Math.round((end - start) / 86_400_000));
}
