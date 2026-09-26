import type { Occurrence } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  markOccurrencesResolved,
  removeOccurrences,
  upsertOccurrence,
} from "@/lib/occurrences/storage";
import {
  EMPTY_OCCURRENCES,
  type OccurrencesState,
} from "@/lib/occurrences/types";
import { buildDemoOccurrences } from "./demo";
import { readStore, writeStore } from "./store";

function normalizeOccurrence(occurrence: Occurrence): Occurrence {
  return {
    ...occurrence,
    ownerId: occurrence.ownerId ?? null,
    unit: occurrence.unit ?? null,
    vendorId: occurrence.vendorId ?? null,
    assignedTo: occurrence.assignedTo ?? null,
    photos: Array.isArray(occurrence.photos) ? occurrence.photos : [],
    comments: Array.isArray(occurrence.comments) ? occurrence.comments : [],
    history: Array.isArray(occurrence.history) ? occurrence.history : [],
  };
}

function normalizeOccurrences(parsed: OccurrencesState): OccurrencesState {
  return {
    occurrences: Array.isArray(parsed.occurrences)
      ? parsed.occurrences.map(normalizeOccurrence)
      : [],
  };
}

function loadOccurrences(email: string): {
  key: string;
  state: OccurrencesState;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().occurrences[key];
  if (existing) {
    return { key, state: normalizeOccurrences(existing) };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoOccurrences() };
  }
  return { key, state: { ...EMPTY_OCCURRENCES } };
}

/** Load occurrences. Demo fixtures are in-memory until a mutation persists them. */
export function getOccurrences(email: string): OccurrencesState {
  return loadOccurrences(email).state;
}

/** Single read→mutate→write, including first-touch demo seed. */
function mutateOccurrences(
  email: string,
  mutator: (current: OccurrencesState) => OccurrencesState,
): OccurrencesState {
  const { key, state } = loadOccurrences(email);
  const next = normalizeOccurrences(mutator(state));
  const store = readStore();
  store.occurrences[key] = next;
  writeStore(store);
  return next;
}

export function putOccurrence(
  email: string,
  occurrence: Occurrence,
): OccurrencesState {
  const withId = occurrence.id
    ? occurrence
    : { ...occurrence, id: crypto.randomUUID() };
  return mutateOccurrences(email, (current) =>
    upsertOccurrence(current, withId),
  );
}

export function deleteOccurrences(
  email: string,
  ids: string[],
): OccurrencesState {
  return mutateOccurrences(email, (current) =>
    removeOccurrences(current, ids),
  );
}

export function resolveOccurrences(
  email: string,
  ids: string[],
): OccurrencesState {
  return mutateOccurrences(email, (current) =>
    markOccurrencesResolved(current, ids),
  );
}
