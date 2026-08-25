import { UserRole } from "@/app/types";
import type { CondoAssignableRole } from "./types";

export type PortalAction = "readExtract" | "readDocuments";

const ROLE_ACTIONS: Record<CondoAssignableRole, ReadonlySet<PortalAction>> = {
  [UserRole.BoardMember]: new Set(["readDocuments", "readExtract"]),
  [UserRole.Resident]: new Set(["readExtract", "readDocuments"]),
  [UserRole.Tenant]: new Set(["readExtract", "readDocuments"]),
  [UserRole.Staff]: new Set(["readDocuments"]),
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
