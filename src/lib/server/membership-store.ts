import type { CondoMembership } from "@/lib/memberships/types";
import { readStore } from "./store";

export function normalizeHostEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Reads host invite list without pulling in membership business logic. */
export function readMembershipsForHost(hostEmail: string): CondoMembership[] {
  const key = normalizeHostEmail(hostEmail);
  return [...(readStore().membershipsByHost[key] ?? [])];
}
