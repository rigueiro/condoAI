import { UserRole } from "@/app/types";
import type { AnnouncementAudience } from "./types";

export function announcementMatchesAudience(
  audience: AnnouncementAudience,
  role: UserRole,
): boolean {
  if (audience === "all") return true;
  if (audience === "board") return role === UserRole.BoardMember;
  return (
    role === UserRole.BoardMember ||
    role === UserRole.Resident ||
    role === UserRole.Tenant
  );
}
