import type { Owner, Unit } from "@/types";
import { deliver } from "@/lib/delivery";
import { votingRoll } from "./rules";
import type { SummonsDelivery } from "./types";

export type SummonsRecipient = {
  ownerId: string;
  name: string;
  email: string;
};

/** Voting owners for the building, with contact email for convocatória delivery. */
export function summonsRecipients(
  units: Unit[],
  owners: Owner[],
  condominiumId: string,
): SummonsRecipient[] {
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  return votingRoll(units, condominiumId).map((share) => {
    const owner = ownerById.get(share.ownerId);
    return {
      ownerId: share.ownerId,
      name: owner?.fullName ?? share.ownerId,
      email: owner?.contacts.email?.trim() ?? "",
    };
  });
}

export type SummonsEmailPayload = {
  assemblyId: string;
  title: string;
  content: string;
};

/**
 * Fan-out summons emails into the client outbox (simulated provider).
 * Does not change legal notice dates — call after sendSummons / resendSummons.
 */
export function deliverAssemblySummonsEmails(
  accountEmail: string,
  payload: SummonsEmailPayload,
  recipients: SummonsRecipient[],
): SummonsDelivery {
  if (typeof window === "undefined") {
    return { emailed: 0, skipped: recipients.length, lastAt: null };
  }

  const subject = payload.title.trim();
  const body = payload.content.trim();
  let emailed = 0;
  let skipped = 0;
  let lastAt: string | null = null;

  for (const recipient of recipients) {
    const to = recipient.email.trim();
    if (!to) {
      skipped += 1;
      continue;
    }
    const message = deliver(accountEmail, {
      channel: "email",
      to,
      subject,
      body,
      kind: "assembly-summons",
      relatedIds: [payload.assemblyId, recipient.ownerId],
    });
    if (!message) {
      skipped += 1;
      continue;
    }
    emailed += 1;
    lastAt = message.createdAt;
  }

  return { emailed, skipped, lastAt };
}
