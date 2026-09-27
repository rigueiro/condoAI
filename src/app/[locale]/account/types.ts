import type { TeamRole, TeamStatus } from "@/lib/team/types";

export interface Organization {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export const EMPTY_ORGANIZATION: Organization = {
  name: "",
  legalName: "",
  taxId: "",
  email: "",
  phone: "",
  website: "",
  addressLine1: "",
  city: "",
  postalCode: "",
  country: "PT",
};

export type { TeamRole, TeamStatus };

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  lastActiveAt?: string;
  isCurrentUser?: boolean;
}
