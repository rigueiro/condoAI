import { deliver } from "@/lib/delivery";
import type { AnnouncementRecipient } from "./types";

/** Simulates email delivery for each recipient via the account outbox. */
export function deliverAnnouncement(
  accountEmail: string,
  recipients: AnnouncementRecipient[],
  subject: string,
  body: string,
  announcementId: string,
): number {
  let count = 0;
  for (const recipient of recipients) {
    const message = deliver(accountEmail, {
      channel: "email",
      to: recipient.email,
      subject,
      body,
      kind: "owner-mailing",
      relatedIds: [announcementId],
    });
    if (message) count += 1;
  }
  return count;
}
