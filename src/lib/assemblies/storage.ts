import type { Assembly, AssembliesState, AssemblySummons } from "./types";
import { emptyMinutes } from "./rules";

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((row) => row.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function normalizeSummons(
  summons: AssemblySummons | null | undefined,
): AssemblySummons | null {
  if (!summons) return null;
  return {
    sentDate: String(summons.sentDate).slice(0, 10),
    method: summons.method === "mail" ? "mail" : "email",
    title: summons.title ?? "",
    content: summons.content ?? "",
    proof: summons.proof ?? null,
    delivery: summons.delivery
      ? {
          emailed: Number(summons.delivery.emailed) || 0,
          skipped: Number(summons.delivery.skipped) || 0,
          lastAt: summons.delivery.lastAt ?? null,
        }
      : null,
    signedByOwnerId: summons.signedByOwnerId ?? null,
    signedByOffice: summons.signedByOffice ?? null,
  };
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
    summons: normalizeSummons(summons),
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
