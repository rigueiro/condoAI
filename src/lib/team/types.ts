export type TeamRole = "owner" | "admin" | "manager" | "staff" | "viewer";

export type TeamStatus = "active" | "invited" | "inactive";

export interface OrgTeamMember {
  id: string;
  memberEmail: string;
  displayName: string;
  role: TeamRole;
  status: TeamStatus;
  invitedAt: string;
  activatedAt?: string;
  lastActiveAt?: string;
}

export function isAssignableTeamRole(
  value: string,
): value is Exclude<TeamRole, "owner"> {
  return value !== "owner" && (value === "admin" || value === "manager" || value === "staff" || value === "viewer");
}
