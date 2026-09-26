import { UserRole } from "@/app/types";
import { isDemoEmail } from "@/lib/auth/constants";
import type { Portfolio } from "@/lib/portfolio/types";
import {
  EMPTY_ANNOUNCEMENTS,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementRecipient,
  type AnnouncementsState,
  type SendAnnouncementInput,
} from "@/lib/announcements/types";
import { upsertAnnouncement } from "@/lib/announcements/storage";
import { buildDemoAnnouncements } from "./demo";
import { getPortfolio } from "./portfolio";
import { readMembershipsForHost } from "./membership-store";
import { readStore, writeStore } from "./store";

function normalizeAnnouncement(announcement: Announcement): Announcement {
  return {
    ...announcement,
    subject: announcement.subject.trim(),
    body: announcement.body.trim(),
    recipientCount: Number(announcement.recipientCount) || 0,
  };
}

function normalizeAnnouncements(parsed: AnnouncementsState): AnnouncementsState {
  return {
    announcements: Array.isArray(parsed.announcements)
      ? parsed.announcements.map(normalizeAnnouncement)
      : [],
  };
}

function loadAnnouncements(email: string): {
  key: string;
  state: AnnouncementsState;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().announcements[key];
  if (existing) {
    return { key, state: normalizeAnnouncements(existing) };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoAnnouncements() };
  }
  return { key, state: { ...EMPTY_ANNOUNCEMENTS } };
}

export function getAnnouncements(email: string): AnnouncementsState {
  return loadAnnouncements(email).state;
}

function mutateAnnouncements(
  email: string,
  mutator: (current: AnnouncementsState) => AnnouncementsState,
): AnnouncementsState {
  const { key, state } = loadAnnouncements(email);
  const next = normalizeAnnouncements(mutator(state));
  const store = readStore();
  store.announcements[key] = next;
  writeStore(store);
  return next;
}

function ownersInCondominium(
  portfolio: Portfolio,
  condominiumId: string,
): { id: string; fullName: string; email: string }[] {
  const ownerIds = new Set<string>();
  for (const unit of portfolio.units) {
    if (unit.condominiumId !== condominiumId) continue;
    for (const occ of unit.occupancies) {
      if (occ.role === "owner") ownerIds.add(occ.ownerId);
    }
  }
  return portfolio.owners
    .filter((owner) => ownerIds.has(owner.id))
    .map((owner) => ({
      id: owner.id,
      fullName: owner.fullName,
      email: owner.contacts.email.trim(),
    }))
    .filter((owner) => owner.email.length > 0);
}

function boardRecipients(
  hostEmail: string,
  condominiumId: string,
): AnnouncementRecipient[] {
  const seen = new Set<string>();
  const result: AnnouncementRecipient[] = [];
  for (const membership of readMembershipsForHost(hostEmail)) {
    if (
      membership.condominiumId !== condominiumId ||
      membership.status !== "active" ||
      membership.role !== UserRole.BoardMember
    ) {
      continue;
    }
    const email = membership.memberEmail.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push({ email, name: membership.displayName });
  }
  return result;
}

export function resolveAnnouncementRecipients(
  hostEmail: string,
  condominiumId: string,
  audience: AnnouncementAudience,
): AnnouncementRecipient[] {
  const portfolio = getPortfolio(hostEmail);
  if (!portfolio.condominiums.some((c) => c.id === condominiumId)) {
    throw new Error("condominiumNotFound");
  }

  const seen = new Set<string>();
  const result: AnnouncementRecipient[] = [];

  const add = (email: string, name: string) => {
    const key = email.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push({ email: key, name });
  };

  if (audience === "board") {
    for (const recipient of boardRecipients(hostEmail, condominiumId)) {
      add(recipient.email, recipient.name);
    }
    return result;
  }

  for (const owner of ownersInCondominium(portfolio, condominiumId)) {
    add(owner.email, owner.fullName);
  }

  if (audience === "all") {
    for (const membership of readMembershipsForHost(hostEmail)) {
      if (
        membership.condominiumId !== condominiumId ||
        membership.status !== "active"
      ) {
        continue;
      }
      add(membership.memberEmail, membership.displayName);
    }
  }

  return result;
}

export function sendAnnouncement(
  hostEmail: string,
  input: SendAnnouncementInput,
): { announcement: Announcement; recipients: AnnouncementRecipient[] } {
  const subject = input.subject?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const condominiumId = input.condominiumId?.trim() ?? "";
  if (!condominiumId || !subject || !body) throw new Error("badRequest");

  const recipients = resolveAnnouncementRecipients(
    hostEmail,
    condominiumId,
    input.audience,
  );
  if (recipients.length === 0) throw new Error("noRecipients");

  const now = new Date().toISOString();
  const announcement: Announcement = {
    id: crypto.randomUUID(),
    condominiumId,
    subject,
    body,
    audience: input.audience,
    createdAt: now,
    sentAt: now,
    createdBy: hostEmail.trim().toLowerCase(),
    recipientCount: recipients.length,
  };

  mutateAnnouncements(hostEmail, (current) =>
    upsertAnnouncement(current, announcement),
  );

  return { announcement, recipients };
}

export function listSentAnnouncements(
  hostEmail: string,
  condominiumId?: string,
): Announcement[] {
  const { announcements } = getAnnouncements(hostEmail);
  return announcements
    .filter(
      (a) => a.sentAt && (!condominiumId || a.condominiumId === condominiumId),
    )
    .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
}
