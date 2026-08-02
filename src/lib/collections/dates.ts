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
