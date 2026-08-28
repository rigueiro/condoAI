import { UserRole } from "@/app/types";
import type {
  OccurrenceCategory,
  OccurrencePriority,
  OccurrenceStatus,
} from "@/types";

/** Login roles that can be granted per condomínio (not org-wide manager). */
export const CONDO_ASSIGNABLE_ROLES = [
  UserRole.BoardMember,
  UserRole.Resident,
  UserRole.Tenant,
  UserRole.Staff,
] as const;

export type CondoAssignableRole = (typeof CONDO_ASSIGNABLE_ROLES)[number];

export type MembershipStatus = "active" | "invited" | "inactive";

/**
 * Grants a login identity scoped access to one condomínio in a manager's portfolio.
 * Data stays on the host account; the member only reads through portal APIs.
 */
export type CondoMembership = {
  id: string;
  /** Manager account that owns the portfolio / ledger / documents. */
  hostEmail: string;
  /** Login email of the invited person. */
  memberEmail: string;
  condominiumId: string;
  role: CondoAssignableRole;
  /** Link to Owner CRM row when the member should see an extract. */
  ownerId: string | null;
  displayName: string;
  status: MembershipStatus;
  invitedAt: string;
  activatedAt: string | null;
};

export type PortalDocumentKind =
  | "constitutive-title"
  | "internal-regulations"
  | "insurance"
  | "certificate"
  | "assembly-minutes";

export type PortalDocument = {
  id: string;
  kind: PortalDocumentKind;
  title: string;
  subtitle: string | null;
  date: string | null;
  file: string | null;
};

export type PortalMembershipView = {
  id: string;
  condominiumId: string;
  condominiumName: string;
  address: string;
  role: CondoAssignableRole;
  ownerId: string | null;
  ownerName: string | null;
  unitLabels: string[];
  status: MembershipStatus;
};

import type { TeamRole } from "@/lib/team/types";

export type PortalContext = {
  mode: "manager" | "portal";
  memberships: PortalMembershipView[];
  teamRole?: TeamRole;
};

export type PortalOccurrence = {
  id: string;
  title: string;
  category: OccurrenceCategory;
  unit: string | null;
  status: OccurrenceStatus;
  priority: OccurrencePriority;
  dateTime: string;
  lastUpdate: string | null;
};

export type PortalBudgetLine = {
  key: string;
  amount: number;
};

export type PortalBudget = {
  id: string;
  year: number;
  status: "draft" | "approved";
  ordinary: PortalBudgetLine[];
  ordinaryTotal: number;
  reserveFund: number;
  minimumReserve: number;
  collectable: number;
  monthlyTotal: number;
  shortfall: number;
};

export function isCondoAssignableRole(
  value: string,
): value is CondoAssignableRole {
  return (CONDO_ASSIGNABLE_ROLES as readonly string[]).includes(value);
}
