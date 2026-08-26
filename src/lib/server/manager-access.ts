import { canManager, type ManagerAction } from "@/lib/team/permissions";
import type { TeamRole } from "@/lib/team/types";
import { requireSessionEmail } from "./session";
import { resolveManagerContext, touchTeamActivity } from "./org-team";

export interface ManagerContext {
  sessionEmail: string;
  workspaceEmail: string;
  role: TeamRole;
  can: (action: ManagerAction) => boolean;
}

export async function requireManagerAccess(
  action?: ManagerAction,
): Promise<ManagerContext> {
  const sessionEmail = await requireSessionEmail();
  const ctx = resolveManagerContext(sessionEmail);
  if (!ctx) {
    throw new Error("forbidden");
  }
  if (action && !canManager(ctx.role, action)) {
    throw new Error("forbidden");
  }
  if (ctx.role !== "owner") {
    touchTeamActivity(sessionEmail);
  }
  return {
    sessionEmail,
    workspaceEmail: ctx.workspaceEmail,
    role: ctx.role,
    can: (check) => canManager(ctx.role, check),
  };
}

/** Workspace email for data reads/writes after an ACL check. */
export async function requireWorkspace(
  action?: ManagerAction,
): Promise<string> {
  return (await requireManagerAccess(action)).workspaceEmail;
}
