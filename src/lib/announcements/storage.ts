import type { Announcement, AnnouncementsState } from "./types";

export function upsertAnnouncement(
  state: AnnouncementsState,
  announcement: Announcement,
): AnnouncementsState {
  const idx = state.announcements.findIndex((a) => a.id === announcement.id);
  if (idx === -1) {
    return {
      announcements: [announcement, ...state.announcements],
    };
  }
  const next = [...state.announcements];
  next[idx] = announcement;
  return { announcements: next };
}
