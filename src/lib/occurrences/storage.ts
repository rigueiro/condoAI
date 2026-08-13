import type { Occurrence } from "@/types";
import type { OccurrencesState } from "./types";

function upsertById(items: Occurrence[], item: Occurrence): Occurrence[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

export function upsertOccurrence(
  state: OccurrencesState,
  occurrence: Occurrence,
): OccurrencesState {
  return { occurrences: upsertById(state.occurrences, occurrence) };
}

export function removeOccurrences(
  state: OccurrencesState,
  ids: string[],
): OccurrencesState {
  const idSet = new Set(ids);
  return {
    occurrences: state.occurrences.filter((o) => !idSet.has(o.id)),
  };
}

export function markOccurrencesResolved(
  state: OccurrencesState,
  ids: string[],
): OccurrencesState {
  const idSet = new Set(ids);
  return {
    occurrences: state.occurrences.map((o) =>
      idSet.has(o.id) ? { ...o, status: "Resolved" as const } : o,
    ),
  };
}
