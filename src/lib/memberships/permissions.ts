import { UserRole } from "@/app/types";
import type { CondoAssignableRole } from "./types";

export type PortalAction =
  | "readExtract"
  | "readDocuments"
  | "readOccurrences"
  | "readAnnouncements"
  | "readBudget"
  | "approveBudget";

const ROLE_ACTIONS: Record<CondoAssignableRole, ReadonlySet<PortalAction>> = {
  [UserRole.BoardMember]: new Set([
    "readDocuments",
    "readExtract",
    "readOccurrences",
    "readAnnouncements",
    "readBudget",
    "approveBudget",
  ]),
  [UserRole.Resident]: new Set([
    "readExtract",
    "readDocuments",
    "readOccurrences",
    "readAnnouncements",
  ]),
  [UserRole.Tenant]: new Set([
    "readExtract",
    "readDocuments",
    "readOccurrences",
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
