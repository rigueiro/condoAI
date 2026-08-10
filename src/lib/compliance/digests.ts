import { deliver } from "@/lib/delivery";
import type { AttentionItem } from "./types";

type DigestStore = {
  date: string;
  sent: boolean;
};

export type DigestCopy = {
  subject: (count: number) => string;
  body: (items: AttentionItem[]) => string;
};

export type DigestItemLabels = {
  overdue: string;
  dueSoon: string;
  dueToday: string;
  daysOverdue: (count: number) => string;
  daysLeft: (count: number) => string;
  insurance: (insurer: string) => string;
  certificate: (typeLabel: string) => string;
  certificateTypeLabel: (type: string) => string;
};

function digestsKey(email: string): string {
  return `condoai.compliance.digest.${email.trim().toLowerCase()}`;
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function readDigestSentToday(email: string, now = new Date()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(digestsKey(email));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as DigestStore;
    return parsed.date === todayKey(now) && parsed.sent === true;
  } catch {
    return false;
  }
}

export function writeDigestSentToday(email: string, now = new Date()): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    digestsKey(email),
    JSON.stringify({
      date: todayKey(now),
      sent: true,
    } satisfies DigestStore),
  );
}

function urgencyLine(item: AttentionItem, labels: DigestItemLabels): string {
  if (item.daysUntil < 0) {
    return labels.daysOverdue(Math.abs(item.daysUntil));
  }
  if (item.daysUntil === 0) return labels.dueToday;
  return labels.daysLeft(item.daysUntil);
}

function itemTitle(item: AttentionItem, labels: DigestItemLabels): string {
  if (item.kind === "insurance") {
    return labels.insurance(item.title);
  }
  return labels.certificate(labels.certificateTypeLabel(item.title));
}

/**
 * Delivers a deadline digest to the manager via the shared outbox (email).
 * Returns false when the recipient email is missing.
 */
export function sendDeadlineDigestMessage(
  accountEmail: string,
  toEmail: string,
  items: AttentionItem[],
  copy: DigestCopy,
): boolean {
  if (typeof window === "undefined") return false;
  const to = toEmail.trim();
  if (!to || items.length === 0) return false;

  const message = deliver(accountEmail, {
    channel: "email",
    to,
    subject: copy.subject(items.length),
    body: copy.body(items),
    kind: "compliance-digest",
    relatedIds: items.map((item) => item.id),
  });
  return message !== null;
}

export function formatDigestBody(
  items: AttentionItem[],
  labels: DigestItemLabels,
  intro: string,
  outro: string,
): string {
  const lines = items.map((item) => {
    const badge =
      item.urgency === "overdue" ? labels.overdue : labels.dueSoon;
    const detail =
      item.kind === "insurance" && item.detail ? ` (${item.detail})` : "";
    return `• [${badge}] ${itemTitle(item, labels)}${detail} — ${item.condominiumName} — ${urgencyLine(item, labels)} (${item.dueDate})`;
  });

  return [intro, "", ...lines, "", outro].join("\n");
}
