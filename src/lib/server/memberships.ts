import { UserRole } from "@/app/types";
import type { AnnualBudget, Occurrence } from "@/types";
import {
  isCondoAssignableRole,
  type CondoAssignableRole,
  type CondoMembership,
  type PortalBudget,
  type PortalContext,
  type PortalDocument,
  type PortalMembershipView,
  type PortalOccurrence,
} from "@/lib/memberships/types";
import { canPortal, canPortalComment } from "@/lib/memberships/permissions";
import { buildExtract } from "@/lib/collections/ledger";
import type { LedgerMovement } from "@/lib/collections/types";
import { formatPortugueseAddress } from "@/lib/address";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import { DEMO_EMAIL } from "@/lib/auth/constants";
import type { Portfolio } from "@/lib/portfolio/types";
import type { Announcement } from "@/lib/announcements/types";
import { announcementMatchesAudience } from "@/lib/announcements/audience";
import {
  getAnnouncements,
} from "@/lib/server/announcements";
import { summarizeBudget } from "@/lib/finance/budget";
import { getFinance, markBudgetApproved } from "@/lib/server/finance";
import { sanitizeOccurrencePhotos } from "@/lib/occurrences/photos";
import { getOccurrences, putOccurrence } from "@/lib/server/occurrences";
import { getAssemblies } from "./assemblies";
import { getCollections } from "./collections";
import { getCompliance } from "./compliance";
import { getPortfolio } from "./portfolio";
import { readStore, updateStore } from "./store";
import { isOrgTeamMember, resolveManagerContext } from "./org-team";
import { readMembershipsForHost } from "./membership-store";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function todayIso(): string {
  return new Date().toISOString();
}

function isoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}

export function listMembershipsForHost(hostEmail: string): CondoMembership[] {
  return readMembershipsForHost(hostEmail);
}

export function listMembershipsForMember(
  memberEmail: string,
): CondoMembership[] {
  const key = normalizeEmail(memberEmail);
  const result: CondoMembership[] = [];
  for (const list of Object.values(readStore().membershipsByHost)) {
    for (const membership of list) {
      if (membership.memberEmail === key) result.push(membership);
    }
  }
  return result;
}

function liveMembershipsForMember(memberEmail: string): CondoMembership[] {
  return listMembershipsForMember(memberEmail).filter(
    (m) => m.status === "active" || m.status === "invited",
  );
}

/** True when the account owns a manager workspace (not portal-only). */
export function isManagerAccount(email: string): boolean {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) return true;
  const store = readStore();
  const portfolio = store.portfolios[key];
  if (portfolio?.organization || (portfolio?.condominiums?.length ?? 0) > 0) {
    return true;
  }
  if (isOrgTeamMember(key)) {
    return true;
  }
  const roleCode = store.accounts[key]?.roleCode;
  return (
    roleCode === UserRole.PropertyManager || roleCode === UserRole.SuperAdmin
  );
}

export function resolveAccessMode(email: string): "manager" | "portal" {
  if (isManagerAccount(email)) return "manager";
  return liveMembershipsForMember(email).length > 0 ? "portal" : "manager";
}

function saveHostMemberships(
  hostEmail: string,
  memberships: CondoMembership[],
): void {
  const key = normalizeEmail(hostEmail);
  updateStore((store) => {
    store.membershipsByHost[key] = memberships;
  });
}

function activateAndList(memberEmail: string): CondoMembership[] {
  const key = normalizeEmail(memberEmail);
  updateStore((store) => {
    for (const host of Object.keys(store.membershipsByHost)) {
      store.membershipsByHost[host] = store.membershipsByHost[host].map(
        (membership) => {
          if (
            membership.memberEmail !== key ||
            membership.status !== "invited"
          ) {
            return membership;
          }
          return {
            ...membership,
            status: "active" as const,
            activatedAt: todayIso(),
          };
        },
      );
    }
  });
  return liveMembershipsForMember(key);
}

export function inviteMembership(
  hostEmail: string,
  input: {
    memberEmail: string;
    condominiumId: string;
    role: CondoAssignableRole;
    ownerId?: string | null;
    displayName: string;
  },
): CondoMembership {
  const host = normalizeEmail(hostEmail);
  const memberEmail = normalizeEmail(input.memberEmail);
  if (!memberEmail || !input.displayName.trim()) throw new Error("badRequest");
  if (!isCondoAssignableRole(input.role)) throw new Error("badRequest");

  const portfolio = getPortfolio(host);
  if (!portfolio.condominiums.some((c) => c.id === input.condominiumId)) {
    throw new Error("condominiumNotFound");
  }

  const ownerId = input.ownerId?.trim() || null;
  if (ownerId && !portfolio.owners.some((o) => o.id === ownerId)) {
    throw new Error("notFound");
  }

  const existing = listMembershipsForHost(host);
  if (
    existing.some(
      (m) =>
        m.memberEmail === memberEmail &&
        m.condominiumId === input.condominiumId &&
        m.status !== "inactive",
    )
  ) {
    throw new Error("membershipExists");
  }

  const known = Boolean(readStore().accounts[memberEmail]);
  const now = todayIso();
  const membership: CondoMembership = {
    id: crypto.randomUUID(),
    hostEmail: host,
    memberEmail,
    condominiumId: input.condominiumId,
    role: input.role,
    ownerId,
    displayName: input.displayName.trim(),
    status: known ? "active" : "invited",
    invitedAt: now,
    activatedAt: known ? now : null,
  };

  saveHostMemberships(host, [...existing, membership]);
  return membership;
}

export function revokeMembership(
  hostEmail: string,
  membershipId: string,
): void {
  const host = normalizeEmail(hostEmail);
  const list = listMembershipsForHost(host);
  if (!list.some((m) => m.id === membershipId)) throw new Error("notFound");
  saveHostMemberships(
    host,
    list.map((m) =>
      m.id === membershipId ? { ...m, status: "inactive" as const } : m,
    ),
  );
}

function unitLabelsForOwner(
  portfolio: Portfolio,
  ownerId: string,
  condominiumId: string,
): string[] {
  return occupanciesForOwner(portfolio.units, ownerId)
    .filter((row) => row.unit.condominiumId === condominiumId)
    .map((row) => row.unit.label);
}

function toMembershipView(
  membership: CondoMembership,
  portfolio: Portfolio,
): PortalMembershipView {
  const condo = portfolio.condominiums.find(
    (c) => c.id === membership.condominiumId,
  );
  const owner = membership.ownerId
    ? portfolio.owners.find((o) => o.id === membership.ownerId)
    : undefined;

  return {
    id: membership.id,
    condominiumId: membership.condominiumId,
    condominiumName: condo?.name ?? membership.condominiumId,
    address: condo ? formatPortugueseAddress(condo.address) : "",
    role: membership.role,
    ownerId: membership.ownerId,
    ownerName: owner?.fullName ?? null,
    unitLabels: membership.ownerId
      ? unitLabelsForOwner(
          portfolio,
          membership.ownerId,
          membership.condominiumId,
        )
      : [],
    status: membership.status,
  };
}

export function buildPortalContext(email: string): PortalContext {
  const mode = resolveAccessMode(email);
  if (mode === "manager") {
    const ctx = resolveManagerContext(email);
    return { mode, memberships: [], teamRole: ctx?.role ?? "owner" };
  }

  const live = activateAndList(email);
  const portfolioByHost = new Map<string, Portfolio>();
  const memberships = live.map((m) => {
    let portfolio = portfolioByHost.get(m.hostEmail);
    if (!portfolio) {
      portfolio = getPortfolio(m.hostEmail);
      portfolioByHost.set(m.hostEmail, portfolio);
    }
    return toMembershipView(m, portfolio);
  });
  return { mode: "portal", memberships };
}

function requireMembership(
  memberEmail: string,
  condominiumId: string,
): CondoMembership {
  const membership = activateAndList(memberEmail).find(
    (m) => m.condominiumId === condominiumId,
  );
  if (!membership) throw new Error("forbidden");
  return membership;
}

export function portalExtract(
  memberEmail: string,
  condominiumId: string,
): {
  movements: LedgerMovement[];
  ownerName: string;
  unitLabel: string;
  condominiumName: string;
} {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "readExtract")) throw new Error("forbidden");
  if (!membership.ownerId) throw new Error("extractUnavailable");

  const portfolio = getPortfolio(membership.hostEmail);
  const owner = portfolio.owners.find((o) => o.id === membership.ownerId);
  if (!owner) throw new Error("notFound");

  const collections = getCollections(membership.hostEmail);
  const condo = portfolio.condominiums.find((c) => c.id === condominiumId);

  return {
    movements: buildExtract(
      membership.ownerId,
      collections.quotas,
      collections.charges,
      collections.receipts,
    ),
    ownerName: owner.fullName,
    unitLabel:
      unitLabelsForOwner(portfolio, membership.ownerId, condominiumId).join(
        ", ",
      ) || "—",
    condominiumName: condo?.name ?? "",
  };
}

function portalDoc(
  partial: Omit<PortalDocument, "subtitle"> & { subtitle?: string | null },
): PortalDocument {
  return { subtitle: null, ...partial };
}

export function portalDocuments(
  memberEmail: string,
  condominiumId: string,
): { documents: PortalDocument[] } {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "readDocuments")) {
    throw new Error("forbidden");
  }

  const portfolio = getPortfolio(membership.hostEmail);
  const condo = portfolio.condominiums.find((c) => c.id === condominiumId);
  if (!condo) throw new Error("condominiumNotFound");

  const compliance = getCompliance(membership.hostEmail);
  const assemblies = getAssemblies(membership.hostEmail);
  const documents: PortalDocument[] = [
    portalDoc({
      id: `title-${condo.id}`,
      kind: "constitutive-title",
      title: condo.propertyRegistryNumber || "",
      date: isoDate(condo.deedDate),
      file: condo.constitutiveTitle,
    }),
    portalDoc({
      id: `regs-${condo.id}`,
      kind: "internal-regulations",
      title: condo.internalRegulations.version
        ? `v${condo.internalRegulations.version}`
        : "",
      date: isoDate(condo.internalRegulations.date),
      file: condo.internalRegulations.file,
    }),
  ];

  for (const policy of compliance.policies) {
    if (policy.condominiumId !== condominiumId) continue;
    documents.push(
      portalDoc({
        id: `ins-${policy.id}`,
        kind: "insurance",
        title: policy.insurer,
        subtitle: policy.number,
        date: isoDate(policy.renewalDate),
        file: null,
      }),
    );
  }

  for (const cert of compliance.certificates) {
    if (cert.condominiumId !== condominiumId) continue;
    documents.push(
      portalDoc({
        id: `cert-${cert.id}`,
        kind: "certificate",
        title: cert.type,
        date: isoDate(cert.validity),
        file: cert.file,
      }),
    );
  }

  for (const assembly of assemblies.assemblies) {
    if (assembly.condominiumId !== condominiumId) continue;
    if (!assembly.minutes?.file && !assembly.minutes?.text) continue;
    documents.push(
      portalDoc({
        id: `minutes-${assembly.id}`,
        kind: "assembly-minutes",
        title: assembly.title,
        subtitle: assembly.type,
        date: isoDate(assembly.scheduledDate),
        file: assembly.minutes.file,
      }),
    );
  }

  return { documents };
}

function isoDateTime(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return String(value);
}

const OCCURRENCE_CATEGORIES = new Set([
  "MAINTENANCE",
  "NOISE",
  "PARKING",
  "PET",
  "CLEANLINESS",
  "SECURITY",
  "LEAK_WATER_DAMAGE",
  "ELEVATOR",
  "COMMON_AREA",
  "RULE_VIOLATION",
  "OTHER",
]);

function toPortalOccurrence(occurrence: Occurrence): PortalOccurrence {
  const history = occurrence.history ?? [];
  const comments = occurrence.comments ?? [];
  const lastHistory = history.at(-1);
  const lastComment = comments.at(-1);
  return {
    id: occurrence.id,
    title: occurrence.title,
    description: occurrence.description,
    category: occurrence.category,
    unit: occurrence.unit,
    ownerId: occurrence.ownerId ?? null,
    status: occurrence.status,
    priority: occurrence.priority,
    dateTime: isoDateTime(occurrence.dateTime) ?? "",
    lastUpdate: isoDateTime(lastComment?.createdAt ?? lastHistory?.date),
    photos: Array.isArray(occurrence.photos) ? occurrence.photos : [],
    comments,
  };
}

function canSeeOccurrence(
  membership: CondoMembership,
  occurrence: Occurrence,
): boolean {
  if (occurrence.condominiumId !== membership.condominiumId) return false;
  if (
    membership.role === UserRole.BoardMember ||
    membership.role === UserRole.Staff
  ) {
    return true;
  }
  if (!membership.ownerId) return false;
  return occurrence.ownerId === membership.ownerId || occurrence.ownerId === null;
}

export function portalCreateOccurrence(
  memberEmail: string,
  input: {
    condominiumId: string;
    title: unknown;
    description: unknown;
    category: unknown;
    unit?: unknown;
    photos?: unknown;
  },
): { occurrence: PortalOccurrence } {
  const membership = requireMembership(memberEmail, input.condominiumId);
  if (!canPortal(membership.role, "createOccurrence")) {
    throw new Error("forbidden");
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const category =
    typeof input.category === "string" && OCCURRENCE_CATEGORIES.has(input.category)
      ? input.category
      : null;
  if (!title || !description || !category) throw new Error("badRequest");

  const reportedOn = todayIso().slice(0, 10);
  const occurrence: Occurrence = {
    id: crypto.randomUUID(),
    condominiumId: membership.condominiumId,
    ownerId: membership.ownerId,
    title,
    description,
    category: category as Occurrence["category"],
    unit: typeof input.unit === "string" ? input.unit.trim() || null : null,
    dateTime: reportedOn,
    status: "Open",
    priority: "MEDIUM",
    vendorId: null,
    assignedTo: null,
    photos: sanitizeOccurrencePhotos(input.photos),
    comments: [],
    history: [
      {
        action: "reported",
        date: reportedOn,
        author: membership.displayName,
      },
    ],
  };

  putOccurrence(membership.hostEmail, occurrence);
  return { occurrence: toPortalOccurrence(occurrence) };
}

export function portalAddOccurrenceComment(
  memberEmail: string,
  condominiumId: string,
  occurrenceId: string,
  message: unknown,
): { occurrence: PortalOccurrence } {
  const membership = requireMembership(memberEmail, condominiumId);
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) throw new Error("badRequest");

  const existing = getOccurrences(membership.hostEmail).occurrences.find(
    (occ) => occ.id === occurrenceId && occ.condominiumId === condominiumId,
  );
  if (!existing) throw new Error("notFound");
  if (
    !canPortalComment(membership.role, membership.ownerId, existing.ownerId)
  ) {
    throw new Error("forbidden");
  }

  const next: Occurrence = {
    ...existing,
    comments: [
      ...(existing.comments ?? []),
      {
        id: crypto.randomUUID(),
        author: membership.displayName,
        message: text,
        createdAt: todayIso().slice(0, 10),
      },
    ],
  };
  putOccurrence(membership.hostEmail, next);
  return { occurrence: toPortalOccurrence(next) };
}

export function portalOccurrences(
  memberEmail: string,
  condominiumId: string,
): { occurrences: PortalOccurrence[] } {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "readOccurrences")) {
    throw new Error("forbidden");
  }

  const { occurrences } = getOccurrences(membership.hostEmail);
  const filtered = occurrences.filter((occ) => canSeeOccurrence(membership, occ));

  return {
    occurrences: filtered
      .map(toPortalOccurrence)
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
  };
}

export function portalAnnouncements(
  memberEmail: string,
  condominiumId: string,
): { announcements: Announcement[] } {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "readAnnouncements")) {
    throw new Error("forbidden");
  }

  const { announcements } = getAnnouncements(membership.hostEmail);
  return {
    announcements: announcements
      .filter(
        (a) =>
          a.sentAt &&
          a.condominiumId === condominiumId &&
          announcementMatchesAudience(a.audience, membership.role),
      )
      .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt))),
  };
}

function toPortalBudget(budget: AnnualBudget): PortalBudget {
  const summary = summarizeBudget(budget);
  return {
    id: budget.id,
    year: budget.year,
    status: budget.status,
    ordinary: Object.entries(summary.ordinary).map(([key, amount]) => ({
      key,
      amount,
    })),
    ordinaryTotal: summary.ordinaryTotal,
    reserveFund: summary.reserveFund,
    minimumReserve: summary.minimumReserve,
    collectable: summary.collectable,
    monthlyTotal: summary.monthlyTotal,
    shortfall: summary.shortfall,
  };
}

export function portalBudget(
  memberEmail: string,
  condominiumId: string,
): { budget: PortalBudget | null } {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "readBudget")) throw new Error("forbidden");

  const state = getFinance(membership.hostEmail);
  const drafts = state.budgets
    .filter(
      (b) => b.condominiumId === condominiumId && b.status === "draft",
    )
    .sort((a, b) => b.year - a.year);

  const latest = drafts[0];
  return { budget: latest ? toPortalBudget(latest) : null };
}

export function portalApproveBudget(
  memberEmail: string,
  condominiumId: string,
  budgetId: string,
): { budget: PortalBudget } {
  const membership = requireMembership(memberEmail, condominiumId);
  if (!canPortal(membership.role, "approveBudget")) {
    throw new Error("forbidden");
  }

  const state = getFinance(membership.hostEmail);
  const target = state.budgets.find(
    (b) =>
      b.id === budgetId &&
      b.condominiumId === condominiumId &&
      b.status === "draft",
  );
  if (!target) throw new Error("notFound");

  const next = markBudgetApproved(membership.hostEmail, budgetId);
  const approved = next.budgets.find((b) => b.id === budgetId);
  if (!approved) throw new Error("notFound");
  return { budget: toPortalBudget(approved) };
}
