import {
  OccurrenceCategory,
  OccurrencePriority,
  OccurrenceState,
  type OccurrenceCategoryValue,
  type OccurrencePriorityValue,
  type OccurrenceStateKey,
} from "../types";

export const OCCURRENCE_STATE_KEYS = Object.keys(
  OccurrenceState,
) as OccurrenceStateKey[];

export const OCCURRENCE_CATEGORY_VALUES = Object.values(
  OccurrenceCategory,
) as OccurrenceCategoryValue[];

export const OCCURRENCE_PRIORITY_VALUES = Object.values(
  OccurrencePriority,
) as OccurrencePriorityValue[];

// States that still require attention (i.e. not finished).
export const OPEN_STATE_KEYS: OccurrenceStateKey[] = [
  "Open",
  "Acknowledged",
  "InProgress",
  "WaitingForResident",
  "Scheduled",
  "OnHold",
];

export const RESOLVED_STATE_KEYS: OccurrenceStateKey[] = [
  "Resolved",
  "Closed",
];

export const isOpenState = (state: OccurrenceStateKey): boolean =>
  OPEN_STATE_KEYS.includes(state);

export const isResolvedState = (state: OccurrenceStateKey): boolean =>
  RESOLVED_STATE_KEYS.includes(state);

type Badge = { color: string; bg: string };

export const STATE_BADGE: Record<OccurrenceStateKey, Badge> = {
  Open: { color: "text-primary", bg: "bg-primary-100" },
  Acknowledged: { color: "text-primary", bg: "bg-primary-50" },
  InProgress: { color: "text-accent", bg: "bg-accent-100" },
  WaitingForResident: { color: "text-warning", bg: "bg-warning-100" },
  Scheduled: { color: "text-accent", bg: "bg-accent-50" },
  OnHold: { color: "text-warning", bg: "bg-warning-50" },
  Resolved: { color: "text-success", bg: "bg-success-100" },
  Closed: { color: "text-text-secondary", bg: "bg-secondary-100" },
  Cancelled: { color: "text-text-secondary", bg: "bg-secondary-100" },
  Rejected: { color: "text-error", bg: "bg-error-100" },
};

export const PRIORITY_BADGE: Record<OccurrencePriorityValue, Badge> = {
  LOW: { color: "text-text-secondary", bg: "bg-secondary-100" },
  MEDIUM: { color: "text-accent", bg: "bg-accent-100" },
  HIGH: { color: "text-warning", bg: "bg-warning-100" },
  URGENT: { color: "text-error", bg: "bg-error-100" },
};
