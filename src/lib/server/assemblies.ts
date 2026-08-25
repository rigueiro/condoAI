import type { Unit } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import {
  EMPTY_ASSEMBLIES,
  type Assembly,
  type AssembliesState,
  type CreateAssemblyInput,
  type SendSummonsInput,
} from "@/lib/assemblies/types";
import {
  buildResolutions,
  buildSummons,
  defaultSummonsContent,
  mergeAttendance,
  seedAttendance,
  votingRoll,
} from "@/lib/assemblies/rules";
import {
  emptyAssembly,
  normalizeAssembly,
  removeAssembly,
  upsertAssembly,
} from "@/lib/assemblies/storage";
import { buildDemoAssemblies } from "./demo";
import { getPortfolio } from "./portfolio";
import { readStore, writeStore } from "./store";

function normalizeState(parsed: AssembliesState): AssembliesState {
  return {
    assemblies: Array.isArray(parsed.assemblies)
      ? parsed.assemblies.map(normalizeAssembly)
      : [],
  };
}

function loadOrSeed(email: string): {
  key: string;
  state: AssembliesState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().assemblies?.[key];
  if (existing) {
    return { key, state: normalizeState(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: buildDemoAssemblies(), seeded: true };
  }
  return { key, state: { ...EMPTY_ASSEMBLIES }, seeded: false };
}

export function getAssemblies(email: string): AssembliesState {
  const { key, state, seeded } = loadOrSeed(email);
  if (seeded) {
    const store = readStore();
    store.assemblies = store.assemblies ?? {};
    store.assemblies[key] = state;
    writeStore(store);
  }
  return state;
}

function mutate(
  email: string,
  mutator: (current: AssembliesState) => AssembliesState,
): AssembliesState {
  const { key, state } = loadOrSeed(email);
  const next = normalizeState(mutator(state));
  const store = readStore();
  store.assemblies = store.assemblies ?? {};
  store.assemblies[key] = next;
  writeStore(store);
  return next;
}

function requireAssembly(state: AssembliesState, id: string): Assembly {
  const assembly = state.assemblies.find((row) => row.id === id);
  if (!assembly) throw new Error("notFound");
  return assembly;
}

function unitsFor(email: string): Unit[] {
  return getPortfolio(email).units ?? [];
}

export function putAssembly(email: string, assembly: Assembly): AssembliesState {
  if (!assembly.id || !assembly.condominiumId) throw new Error("badRequest");
  return mutate(email, (current) => upsertAssembly(current, assembly));
}

export function deleteAssembly(email: string, id: string): AssembliesState {
  return mutate(email, (current) => removeAssembly(current, id));
}

export function createAssembly(
  email: string,
  input: CreateAssemblyInput,
): AssembliesState {
  if (!input.condominiumId || !input.title.trim() || !input.scheduledDate) {
    throw new Error("badRequest");
  }
  const assembly = emptyAssembly({
    id: crypto.randomUUID(),
    condominiumId: input.condominiumId,
    type: input.type === "extraordinary" ? "extraordinary" : "ordinary",
    title: input.title.trim(),
    scheduledDate: input.scheduledDate.slice(0, 10),
    scheduledTime: input.scheduledTime?.trim() || "18:30",
    location: input.location.trim(),
    agenda: input.agenda ?? [],
    status: "draft",
  });
  return mutate(email, (current) => upsertAssembly(current, assembly));
}

export function sendAssemblySummons(
  email: string,
  input: SendSummonsInput,
): AssembliesState {
  return mutate(email, (current) => {
    const assembly = requireAssembly(current, input.id);
    if (assembly.status === "closed") throw new Error("assemblyClosed");
    if (assembly.agenda.length === 0) throw new Error("agendaRequired");
    const summons = buildSummons({
      method: input.method === "mail" ? "mail" : "email",
      title: input.title || assembly.title,
      content: input.content.trim() || defaultSummonsContent(assembly),
      sentDate: input.sentDate,
      proof: input.proof,
    });
    return upsertAssembly(current, {
      ...assembly,
      summons,
      status: assembly.status === "draft" ? "summoned" : assembly.status,
    });
  });
}

export function openAssemblySession(
  email: string,
  id: string,
  call?: 1 | 2,
): AssembliesState {
  return mutate(email, (current) => {
    const assembly = requireAssembly(current, id);
    if (assembly.status === "closed") throw new Error("assemblyClosed");
    if (assembly.status === "draft") throw new Error("summonsRequired");
    const roll = votingRoll(unitsFor(email), assembly.condominiumId);
    const attendance =
      assembly.attendance.length > 0
        ? mergeAttendance(assembly.attendance, roll)
        : seedAttendance(roll);
    return upsertAssembly(current, {
      ...assembly,
      status: "in_session",
      call: call === 2 ? 2 : assembly.call,
      attendance,
    });
  });
}

export function closeAssembly(email: string, id: string): AssembliesState {
  return mutate(email, (current) => {
    const assembly = requireAssembly(current, id);
    if (assembly.status !== "in_session") throw new Error("notInSession");
    if (!assembly.minutes.text.trim()) throw new Error("minutesRequired");
    const roll = votingRoll(unitsFor(email), assembly.condominiumId);
    return upsertAssembly(current, {
      ...assembly,
      status: "closed",
      minutes: {
        ...assembly.minutes,
        recordedAt:
          assembly.minutes.recordedAt ?? new Date().toISOString().slice(0, 10),
      },
      resolutions: buildResolutions(assembly, roll),
    });
  });
}
