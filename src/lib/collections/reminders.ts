import type { ReminderCopy, ReminderRecipient } from "./types";
import { todayKey } from "./dates";

type ReminderStore = {
  date: string;
  ids: string[];
};

function remindersKey(email: string): string {
  return `condoai.collections.reminded.${email.trim().toLowerCase()}`;
}

export function readRemindedIds(email: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(remindersKey(email));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as ReminderStore;
    if (parsed.date !== todayKey()) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

export function writeRemindedIds(email: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    remindersKey(email),
    JSON.stringify({
      date: todayKey(),
      ids: [...ids],
    } satisfies ReminderStore),
  );
}

/**
 * Opens the user's mail client with a real payment reminder draft.
 * Returns false when no recipient emails are available.
 */
export function openPaymentReminders(
  recipients: ReminderRecipient[],
  copy: ReminderCopy,
): boolean {
  if (typeof window === "undefined") return false;

  const withEmail = recipients.filter((r) => r.email.trim().length > 0);
  if (withEmail.length === 0) return false;

  const subject =
    withEmail.length === 1 ? copy.subjectOne : copy.subjectMany;
  const body =
    withEmail.length === 1
      ? copy.bodyOne(withEmail[0])
      : copy.bodyMany(withEmail);
  const to =
    withEmail.length === 1
      ? withEmail[0].email.trim()
      : `?bcc=${withEmail.map((r) => r.email.trim()).join(",")}`;
  const href =
    withEmail.length === 1
      ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:${to}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = href;
  return true;
}
