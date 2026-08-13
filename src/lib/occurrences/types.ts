import type { Occurrence } from "@/types";

export interface OccurrencesState {
  occurrences: Occurrence[];
}

export const EMPTY_OCCURRENCES: OccurrencesState = {
  occurrences: [],
};
