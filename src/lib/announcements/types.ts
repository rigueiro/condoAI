/** Audience for a condominium-wide mailing. */
export type AnnouncementAudience = "all" | "owners" | "board";

export type Announcement = {
  id: string;
  condominiumId: string;
  subject: string;
  body: string;
  audience: AnnouncementAudience;
  createdAt: string;
  sentAt: string | null;
  createdBy: string;
  recipientCount: number;
};

export interface AnnouncementsState {
  announcements: Announcement[];
}

export const EMPTY_ANNOUNCEMENTS: AnnouncementsState = {
  announcements: [],
};

export type SendAnnouncementInput = {
  condominiumId: string;
  subject: string;
  body: string;
  audience: AnnouncementAudience;
};

export type AnnouncementRecipient = {
  email: string;
  name: string;
};
