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

/** Whole calendar days past due (0 if due today or later). */
export function daysOverdue(dueDate: string, now = new Date()): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.round((startOfNow.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
}
