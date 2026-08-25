import type { Assembly, AssembliesState } from "./types";
import { emptyMinutes } from "./rules";

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((row) => row.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

export function emptyAssembly(
  partial: Pick<Assembly, "id" | "condominiumId" | "type" | "title"> &
    Partial<Assembly>,
): Assembly {
  const {
    agenda,
    summons,
    attendance,
    votes,
    minutes,
    resolutions,
    call,
    ...rest
  } = partial;
  return {
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "18:30",
    location: "",
    status: "draft",
    ...rest,
    call: call === 2 ? 2 : 1,
    agenda: Array.isArray(agenda) ? agenda : [],
    summons: summons ?? null,
    attendance: Array.isArray(attendance) ? attendance : [],
    votes: Array.isArray(votes) ? votes : [],
    minutes: minutes ?? emptyMinutes(),
    resolutions: Array.isArray(resolutions) ? resolutions : [],
  };
}

function normalizeAgenda(assembly: Assembly): Assembly["agenda"] {
  if (!Array.isArray(assembly.agenda)) return [];
  return assembly.agenda.map((item, index) => ({
    id: item.id,
    order: Number.isFinite(item.order) ? item.order : index + 1,
    title: item.title ?? "",
    description: item.description ?? "",
    majority: item.majority ?? "absolute-present",
  }));
}

export function normalizeAssembly(raw: Assembly): Assembly {
  return {
    ...emptyAssembly(raw),
    agenda: normalizeAgenda(raw),
  };
}

export function upsertAssembly(
  state: AssembliesState,
  assembly: Assembly,
): AssembliesState {
  return {
    assemblies: upsertById(state.assemblies, normalizeAssembly(assembly)),
  };
}

export function removeAssembly(
  state: AssembliesState,
  id: string,
): AssembliesState {
  return { assemblies: state.assemblies.filter((row) => row.id !== id) };
}
