import type { DeliverInput, OutboundMessage } from "./types";

const MAX_OUTBOX = 200;

type OutboxStore = {
  messages: OutboundMessage[];
};

function outboxKey(email: string): string {
  return `condoai.delivery.outbox.${email.trim().toLowerCase()}`;
}

function readStore(email: string): OutboxStore {
  if (typeof window === "undefined") return { messages: [] };
  try {
    const raw = window.localStorage.getItem(outboxKey(email));
    if (!raw) return { messages: [] };
    const parsed = JSON.parse(raw) as OutboxStore;
    return { messages: Array.isArray(parsed.messages) ? parsed.messages : [] };
  } catch {
    return { messages: [] };
  }
}

function writeStore(email: string, store: OutboxStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(outboxKey(email), JSON.stringify(store));
}

export function readOutbox(email: string): OutboundMessage[] {
  return readStore(email).messages;
}

/**
 * Records a simulated email/SMS send in the account outbox.
 * Returns null when the destination is empty.
 */
export function deliver(
  accountEmail: string,
  input: DeliverInput,
): OutboundMessage | null {
  if (typeof window === "undefined") return null;
  const to = input.to.trim();
  if (!to) return null;

  const message: OutboundMessage = {
    id: `msg-${crypto.randomUUID()}`,
    channel: input.channel,
    to,
    subject: input.subject,
    body: input.body,
    kind: input.kind,
    relatedIds: input.relatedIds ?? [],
    createdAt: new Date().toISOString(),
    status: "sent",
  };

  const store = readStore(accountEmail);
  const messages = [message, ...store.messages].slice(0, MAX_OUTBOX);
  writeStore(accountEmail, { messages });
  return message;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}
