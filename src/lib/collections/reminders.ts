import { deliver, normalizePhone, type DeliveryChannel } from "@/lib/delivery";
import type {
  ContactAttempt,
  ReminderCopy,
  ReminderRecipient,
  ReminderStage,
} from "./types";
import { todayKey } from "./dates";

type ReminderStore = {
  date: string;
  contacts: ContactAttempt[];
  /** Migrated from early mailto store `{ date, ids }`. */
  ids?: string[];
};

type DigestStore = {
  date: string;
  sent: boolean;
};

export type SendResult = {
  sent: boolean;
  count: number;
  channel?: DeliveryChannel;
  stage?: ReminderStage;
  reason?: "no-contact" | "no-email" | "empty" | "already-contacted";
};

/** Whole calendar days past due (0 if due today or later). */
export function daysOverdue(dueDate: string, now = new Date()): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.round((startOfNow.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function remindersKey(email: string): string {
  return `condoai.collections.reminded.${email.trim().toLowerCase()}`;
}

function collectionsDigestKey(email: string): string {
  return `condoai.collections.digest.${email.trim().toLowerCase()}`;
}

function normalizeContacts(parsed: ReminderStore): ContactAttempt[] {
  if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
    return parsed.contacts;
  }
  if (Array.isArray(parsed.ids)) {
    return parsed.ids.map((quotaId) => ({
      quotaId,
      channel: "email" as const,
      stage: "reminder" as const,
      at: `${parsed.date}T12:00:00.000Z`,
    }));
  }
  return [];
}

export function readContactAttempts(email: string): ContactAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(remindersKey(email));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReminderStore;
    if (parsed.date !== todayKey()) return [];
    return normalizeContacts(parsed);
  } catch {
    return [];
  }
}

export function writeContactAttempts(
  email: string,
  contacts: ContactAttempt[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    remindersKey(email),
    JSON.stringify({
      date: todayKey(),
      contacts,
    } satisfies ReminderStore),
  );
}

export function readCollectionsDigestSentToday(
  email: string,
  now = new Date(),
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(collectionsDigestKey(email));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as DigestStore;
    return parsed.date === todayKey(now) && parsed.sent === true;
  } catch {
    return false;
  }
}

export function writeCollectionsDigestSentToday(
  email: string,
  now = new Date(),
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    collectionsDigestKey(email),
    JSON.stringify({
      date: todayKey(now),
      sent: true,
    } satisfies DigestStore),
  );
}

function pickChannel(
  recipient: ReminderRecipient,
  prefer: DeliveryChannel,
): { channel: DeliveryChannel; to: string } | null {
  const email = recipient.email.trim();
  const phone = normalizePhone(recipient.phone ?? "");

  if (prefer === "email") {
    if (email) return { channel: "email", to: email };
    if (phone) return { channel: "sms", to: phone };
    return null;
  }
  if (phone) return { channel: "sms", to: phone };
  if (email) return { channel: "email", to: email };
  return null;
}

function bodyFor(
  recipient: ReminderRecipient,
  channel: DeliveryChannel,
  stage: ReminderStage,
  copy: ReminderCopy,
): { subject?: string; body: string } {
  if (stage === "escalation") {
    if (channel === "sms") return { body: copy.smsEscalation(recipient) };
    return {
      subject: copy.escalationSubject,
      body: copy.escalationBody(recipient),
    };
  }
  if (channel === "sms") return { body: copy.smsReminder(recipient) };
  return {
    subject: copy.subjectOne,
    body: copy.bodyOne(recipient),
  };
}

function deliverOwnerMessages(
  accountEmail: string,
  recipients: ReminderRecipient[],
  copy: ReminderCopy,
  stage: ReminderStage,
  prefer: DeliveryChannel,
  kind: "payment-reminder" | "payment-escalation",
): { result: SendResult; attempts: ContactAttempt[] } {
  if (typeof window === "undefined") {
    return {
      result: { sent: false, count: 0, reason: "empty" },
      attempts: [],
    };
  }

  let count = 0;
  let lastChannel: DeliveryChannel | undefined;
  const attempts: ContactAttempt[] = [];

  for (const recipient of recipients) {
    const picked = pickChannel(recipient, prefer);
    if (!picked) continue;

    const { subject, body } = bodyFor(
      recipient,
      picked.channel,
      stage,
      copy,
    );
    const message = deliver(accountEmail, {
      channel: picked.channel,
      to: picked.to,
      subject,
      body,
      kind,
      relatedIds: [recipient.id],
    });
    if (!message) continue;

    count += 1;
    lastChannel = picked.channel;
    attempts.push({
      quotaId: recipient.id,
      channel: picked.channel,
      stage,
      at: message.createdAt,
    });
  }

  if (count === 0) {
    return {
      result: { sent: false, count: 0, reason: "no-contact" },
      attempts: [],
    };
  }

  return {
    result: {
      sent: true,
      count,
      channel: lastChannel,
      stage,
    },
    attempts,
  };
}

/** Delivers payment reminders (email preferred, SMS fallback) per recipient. */
export function deliverPaymentReminders(
  accountEmail: string,
  recipients: ReminderRecipient[],
  copy: ReminderCopy,
): { result: SendResult; attempts: ContactAttempt[] } {
  return deliverOwnerMessages(
    accountEmail,
    recipients,
    copy,
    "reminder",
    "email",
    "payment-reminder",
  );
}

/** Escalates overdue quotas (SMS preferred, email fallback) with firmer copy. */
export function deliverPaymentEscalations(
  accountEmail: string,
  recipients: ReminderRecipient[],
  copy: ReminderCopy,
): { result: SendResult; attempts: ContactAttempt[] } {
  return deliverOwnerMessages(
    accountEmail,
    recipients,
    copy,
    "escalation",
    "sms",
    "payment-escalation",
  );
}

export type CollectionsDigestCopy = {
  subject: (count: number) => string;
  body: (recipients: ReminderRecipient[]) => string;
};

/** Emails the manager a digest of overdue quotas (simulated outbox delivery). */
export function deliverCollectionsDigest(
  accountEmail: string,
  toEmail: string,
  recipients: ReminderRecipient[],
  copy: CollectionsDigestCopy,
): SendResult {
  if (typeof window === "undefined") {
    return { sent: false, count: 0, reason: "empty" };
  }
  const to = toEmail.trim();
  if (!to) return { sent: false, count: 0, reason: "no-email" };
  if (recipients.length === 0) {
    return { sent: false, count: 0, reason: "empty" };
  }

  const message = deliver(accountEmail, {
    channel: "email",
    to,
    subject: copy.subject(recipients.length),
    body: copy.body(recipients),
    kind: "collections-digest",
    relatedIds: recipients.map((r) => r.id),
  });

  if (!message) return { sent: false, count: 0, reason: "no-email" };
  return { sent: true, count: recipients.length, channel: "email" };
}

/** Days overdue before an item is eligible for escalation without a prior reminder. */
export const ESCALATION_DAYS = 14;

export function isEscalationEligible(
  attempt: ContactAttempt | undefined,
  overdueDays: number,
): boolean {
  if (attempt?.stage === "escalation") return false;
  if (attempt?.stage === "reminder") return true;
  return overdueDays >= ESCALATION_DAYS;
}
