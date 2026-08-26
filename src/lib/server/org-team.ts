import { DEMO_EMAIL } from "@/lib/auth/constants";
import {
  isAssignableTeamRole,
  type OrgTeamMember,
  type TeamRole,
  type TeamStatus,
} from "@/lib/team/types";
import { readStore, updateStore } from "./store";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function todayIso(): string {
  return new Date().toISOString();
}

function readTeam(hostEmail: string): OrgTeamMember[] {
  const key = normalizeEmail(hostEmail);
  return readStore().orgTeamsByHost[key] ?? [];
}

function saveTeam(hostEmail: string, members: OrgTeamMember[]): void {
  const key = normalizeEmail(hostEmail);
  updateStore((store) => {
    store.orgTeamsByHost[key] = members;
  });
}

function accountDisplayName(email: string): string {
  const account = readStore().accounts[normalizeEmail(email)];
  return account?.name ?? email.split("@")[0] ?? email;
}

function hasOwnWorkspace(email: string): boolean {
  const key = normalizeEmail(email);
  const portfolio = readStore().portfolios[key];
  return Boolean(
    portfolio?.organization || (portfolio?.condominiums?.length ?? 0) > 0,
  );
}

export function findTeamMembership(
  memberEmail: string,
): { hostEmail: string; member: OrgTeamMember } | null {
  const key = normalizeEmail(memberEmail);
  const store = readStore();
  for (const [hostEmail, members] of Object.entries(store.orgTeamsByHost)) {
    const member = members.find(
      (item) =>
        item.memberEmail === key &&
        (item.status === "active" || item.status === "invited"),
    );
    if (member) {
      return { hostEmail, member };
    }
  }
  return null;
}

function activateTeamMember(memberEmail: string): void {
  const key = normalizeEmail(memberEmail);
  updateStore((store) => {
    for (const host of Object.keys(store.orgTeamsByHost)) {
      store.orgTeamsByHost[host] = store.orgTeamsByHost[host].map((member) => {
        if (member.memberEmail !== key || member.status !== "invited") {
          return member;
        }
        return {
          ...member,
          status: "active" as TeamStatus,
          activatedAt: todayIso(),
        };
      });
    }
  });
}

export function resolveManagerContext(sessionEmail: string): {
  workspaceEmail: string;
  role: TeamRole;
} | null {
  const key = normalizeEmail(sessionEmail);
  activateTeamMember(key);

  if (key === DEMO_EMAIL || hasOwnWorkspace(key)) {
    return { workspaceEmail: key, role: "owner" };
  }

  const membership = findTeamMembership(key);
  if (membership) {
    return {
      workspaceEmail: normalizeEmail(membership.hostEmail),
      role: membership.member.role,
    };
  }

  return null;
}

function ensureOwnerMember(hostEmail: string): OrgTeamMember[] {
  const key = normalizeEmail(hostEmail);
  const existing = readTeam(key);
  if (existing.some((member) => member.role === "owner")) {
    return existing;
  }
  const account = readStore().accounts[key];
  const owner: OrgTeamMember = {
    id: `owner-${key}`,
    memberEmail: key,
    displayName: account?.name ?? accountDisplayName(key),
    role: "owner",
    status: "active",
    invitedAt: todayIso(),
    activatedAt: todayIso(),
    lastActiveAt: todayIso(),
  };
  const next = [owner, ...existing];
  saveTeam(key, next);
  return next;
}

export function listTeamMembers(hostEmail: string): OrgTeamMember[] {
  const members = ensureOwnerMember(hostEmail);
  return members.filter((member) => member.status !== "inactive");
}

export function inviteTeamMember(
  hostEmail: string,
  input: { memberEmail: string; role: TeamRole; displayName?: string },
): OrgTeamMember {
  const hostKey = normalizeEmail(hostEmail);
  const memberKey = normalizeEmail(input.memberEmail);

  if (memberKey === hostKey) {
    throw new Error("cannotInviteSelf");
  }
  if (input.role === "owner") {
    throw new Error("badRequest");
  }
  if (!isAssignableTeamRole(input.role)) {
    throw new Error("badRequest");
  }

  const team = ensureOwnerMember(hostKey);
  const duplicate = team.find(
    (member) =>
      member.memberEmail === memberKey && member.status !== "inactive",
  );
  if (duplicate) {
    throw new Error("teamMemberExists");
  }

  const hasAccount = Boolean(readStore().accounts[memberKey]);
  const invited: OrgTeamMember = {
    id: crypto.randomUUID(),
    memberEmail: memberKey,
    displayName: input.displayName?.trim() || accountDisplayName(memberKey),
    role: input.role,
    status: hasAccount ? "active" : "invited",
    invitedAt: todayIso(),
    activatedAt: hasAccount ? todayIso() : undefined,
  };

  saveTeam(hostKey, [...team, invited]);
  return invited;
}

export function updateTeamMemberRole(
  hostEmail: string,
  memberId: string,
  role: TeamRole,
): OrgTeamMember {
  if (role === "owner") {
    throw new Error("badRequest");
  }
  if (!isAssignableTeamRole(role)) {
    throw new Error("badRequest");
  }

  const hostKey = normalizeEmail(hostEmail);
  const team = ensureOwnerMember(hostKey);
  const index = team.findIndex((member) => member.id === memberId);
  if (index < 0) {
    throw new Error("notFound");
  }
  if (team[index].role === "owner") {
    throw new Error("forbidden");
  }

  const updated = { ...team[index], role };
  const next = [...team];
  next[index] = updated;
  saveTeam(hostKey, next);
  return updated;
}

export function removeTeamMember(hostEmail: string, memberId: string): void {
  const hostKey = normalizeEmail(hostEmail);
  const team = ensureOwnerMember(hostKey);
  const target = team.find((member) => member.id === memberId);
  if (!target) {
    throw new Error("notFound");
  }
  if (target.role === "owner") {
    throw new Error("forbidden");
  }

  const next = team.map((member) =>
    member.id === memberId
      ? { ...member, status: "inactive" as TeamStatus }
      : member,
  );
  saveTeam(hostKey, next);
}

export function touchTeamActivity(sessionEmail: string): void {
  const key = normalizeEmail(sessionEmail);
  const membership = findTeamMembership(key);
  if (!membership) return;

  const hostKey = normalizeEmail(membership.hostEmail);
  const team = readTeam(hostKey);
  const next = team.map((member) =>
    member.memberEmail === key
      ? { ...member, lastActiveAt: todayIso() }
      : member,
  );
  saveTeam(hostKey, next);
}

export function isOrgTeamMember(email: string): boolean {
  return findTeamMembership(email) !== null;
}

export function toTeamMemberView(
  member: OrgTeamMember,
  sessionEmail: string,
) {
  const account = readStore().accounts[member.memberEmail];
  const sessionKey = sessionEmail.trim().toLowerCase();
  return {
    id: member.id,
    name: account?.name ?? member.displayName,
    email: member.memberEmail,
    role: member.role,
    status: member.status,
    lastActiveAt: member.lastActiveAt,
    isCurrentUser: member.memberEmail === sessionKey,
  };
}
