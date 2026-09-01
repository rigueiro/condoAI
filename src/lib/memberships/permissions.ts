import { UserRole } from "@/app/types";
import type { CondoAssignableRole } from "./types";

export type PortalAction =
  | "readExtract"
  | "readDocuments"
  | "readOccurrences"
  | "createOccurrence"
  | "readAnnouncements"
  | "readBudget"
  | "approveBudget";

const ROLE_ACTIONS: Record<CondoAssignableRole, ReadonlySet<PortalAction>> = {
  [UserRole.BoardMember]: new Set([
    "readDocuments",
    "readExtract",
    "readOccurrences",
    "createOccurrence",
    "readAnnouncements",
    "readBudget",
    "approveBudget",
  ]),
  [UserRole.Resident]: new Set([
    "readExtract",
    "readDocuments",
    "readOccurrences",
    "createOccurrence",
    "readAnnouncements",
  ]),
  [UserRole.Tenant]: new Set([
    "readExtract",
    "readDocuments",
    "readOccurrences",
    "createOccurrence",
    "readAnnouncements",
  ]),
  [UserRole.Staff]: new Set(["readDocuments", "readOccurrences", "readAnnouncements"]),
};

export function canPortal(
  role: CondoAssignableRole,
  action: PortalAction,
): boolean {
  return ROLE_ACTIONS[role].has(action);
}

export function canPortalComment(
  role: CondoAssignableRole,
  memberOwnerId: string | null,
  occurrenceOwnerId: string | null,
): boolean {
  if (!canPortal(role, "createOccurrence")) return false;
  if (role === UserRole.BoardMember) return true;
  return Boolean(memberOwnerId) && occurrenceOwnerId === memberOwnerId;
}

const ROLE_DISPLAY: Record<
  CondoAssignableRole,
  "boardMember" | "resident" | "tenant" | "staff"
> = {
  [UserRole.BoardMember]: "boardMember",
  [UserRole.Resident]: "resident",
  [UserRole.Tenant]: "tenant",
  [UserRole.Staff]: "staff",
};

export function roleDisplayKey(role: CondoAssignableRole) {
  return ROLE_DISPLAY[role];
}
