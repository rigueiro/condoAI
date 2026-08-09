import type { Condominium, Occurrence, Owner } from "@/types";

export type { Occurrence, OccurrenceComment, OccurrenceStatus } from "@/types";

export enum OccurrenceState {
  Open = "Open",
  Acknowledged = "Acknowledged",
  InProgress = "InProgress",
  WaitingForResident = "WaitingForResident",
  Scheduled = "Scheduled",
  OnHold = "OnHold",
  Resolved = "Resolved",
  Closed = "Closed",
  Cancelled = "Cancelled",
  Rejected = "Rejected",
}

export enum OccurrenceCategory {
  Maintenance = "MAINTENANCE",
  Noise = "NOISE",
  Parking = "PARKING",
  Pet = "PET",
  Cleanliness = "CLEANLINESS",
  Security = "SECURITY",
  LeakWaterDamage = "LEAK_WATER_DAMAGE",
  Elevator = "ELEVATOR",
  CommonArea = "COMMON_AREA",
  RuleViolation = "RULE_VIOLATION",
  Other = "OTHER",
}

export enum OccurrencePriority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
  Urgent = "URGENT",
}

export type OccurrenceStateKey = keyof typeof OccurrenceState;
export type OccurrencePriorityValue = `${OccurrencePriority}`;
export type OccurrenceCategoryValue = `${OccurrenceCategory}`;

/** Derived list/detail row: domain Occurrence + condo/owner display names. */
export type OccurrenceRow = {
  occurrence: Occurrence;
  condominiumName: string;
  ownerName: string | null;
};

export function formatOccurrenceDate(value: Date | string): string {
  return typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

function buildLookupMaps(
  condominiums: Pick<Condominium, "id" | "name">[],
  owners: Pick<Owner, "id" | "fullName">[],
) {
  return {
    condoById: new Map(condominiums.map((c) => [c.id, c.name])),
    ownerById: new Map(owners.map((o) => [o.id, o.fullName])),
  };
}

function joinOccurrence(
  occurrence: Occurrence,
  condoById: Map<string, string>,
  ownerById: Map<string, string>,
): OccurrenceRow {
  return {
    occurrence,
    condominiumName:
      condoById.get(occurrence.condominiumId) ?? occurrence.condominiumId,
    ownerName: occurrence.ownerId
      ? (ownerById.get(occurrence.ownerId) ?? null)
      : null,
  };
}

export function toOccurrenceRow(
  occurrence: Occurrence,
  condominiums: Pick<Condominium, "id" | "name">[],
  owners: Pick<Owner, "id" | "fullName">[],
): OccurrenceRow {
  const { condoById, ownerById } = buildLookupMaps(condominiums, owners);
  return joinOccurrence(occurrence, condoById, ownerById);
}

export function toOccurrenceRows(
  occurrences: Occurrence[],
  condominiums: Pick<Condominium, "id" | "name">[],
  owners: Pick<Owner, "id" | "fullName">[],
): OccurrenceRow[] {
  const { condoById, ownerById } = buildLookupMaps(condominiums, owners);
  return occurrences.map((o) => joinOccurrence(o, condoById, ownerById));
}
