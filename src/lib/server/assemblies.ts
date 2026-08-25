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
  canRecordVotes,
  defaultSummonsContent,
  normalizeAttendanceRows,
  noticeMeetsLegalMinimum,
  noticeSatisfied,
  quorumMet,
  sanitizeVotes,
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

function condoContext(email: string, condominiumId: string) {
  const portfolio = getPortfolio(email);
  return {
    units: portfolio.units ?? [],
    totalCapital: portfolio.condominiums.find((condo) => condo.id === condominiumId)
      ?.totalPermillage,
  };
}

/**
 * Status-locked upsert:
 * - draft: schedule + agenda only
 * - in_session: attendance / votes / minutes (votes need quorum)
 * - summoned / closed: rejected
 */
export function putAssembly(email: string, incoming: Assembly): AssembliesState {
  if (!incoming.id || !incoming.condominiumId) throw new Error("badRequest");
  return mutate(email, (current) => {
    const existing = requireAssembly(current, incoming.id);
    if (existing.condominiumId !== incoming.condominiumId) {
      throw new Error("badRequest");
    }
    if (existing.status === "closed") throw new Error("assemblyClosed");
    if (existing.status === "summoned") throw new Error("assemblyLocked");

    if (existing.status === "draft") {
      return upsertAssembly(current, {
        ...existing,
        type: incoming.type === "extraordinary" ? "extraordinary" : "ordinary",
        title: incoming.title?.trim() || existing.title,
        scheduledDate:
          incoming.scheduledDate?.slice(0, 10) || existing.scheduledDate,
        scheduledTime: incoming.scheduledTime || existing.scheduledTime,
        location:
          typeof incoming.location === "string"
            ? incoming.location
            : existing.location,
        agenda: Array.isArray(incoming.agenda) ? incoming.agenda : existing.agenda,
      });
    }

    const { units, totalCapital } = condoContext(email, existing.condominiumId);
    const roll = votingRoll(units, existing.condominiumId);
    const attendance = Array.isArray(incoming.attendance)
      ? normalizeAttendanceRows(incoming.attendance, roll)
      : existing.attendance;
    const withAttendance = { ...existing, attendance };

    const votes =
      Array.isArray(incoming.votes) &&
      canRecordVotes(withAttendance, roll, totalCapital)
        ? sanitizeVotes(incoming.votes, withAttendance)
        : existing.votes;

    const minutes = incoming.minutes
      ? {
          text: String(incoming.minutes.text ?? ""),
          file:
            incoming.minutes.file === undefined
              ? existing.minutes.file
              : incoming.minutes.file,
          recordedAt: existing.minutes.recordedAt,
        }
      : existing.minutes;

    return upsertAssembly(current, {
      ...existing,
      attendance,
      votes,
      minutes,
    });
  });
}

export function deleteAssembly(email: string, id: string): AssembliesState {
  return mutate(email, (current) => {
    const assembly = requireAssembly(current, id);
    if (assembly.status !== "draft") throw new Error("assemblyLocked");
    return removeAssembly(current, id);
  });
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
    if (assembly.status !== "draft") {
      throw new Error(
        assembly.status === "closed" ? "assemblyClosed" : "assemblyLocked",
      );
    }
    if (
      assembly.agenda.length === 0 ||
      assembly.agenda.some((item) => !item.title.trim())
    ) {
      throw new Error("agendaRequired");
    }

    const summons = buildSummons({
      method: input.method === "mail" ? "mail" : "email",
      title: input.title || assembly.title,
      content: input.content.trim() || defaultSummonsContent(assembly),
      sentDate: input.sentDate,
      proof: input.proof,
    });
    if (!noticeMeetsLegalMinimum(assembly.scheduledDate, summons.sentDate)) {
      throw new Error("noticeTooShort");
    }

    return upsertAssembly(current, {
      ...assembly,
      summons,
      status: "summoned",
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
    if (!noticeSatisfied(assembly)) throw new Error("noticeTooShort");
    if (call === 1 && assembly.call === 2) throw new Error("badRequest");

    const nextCall: 1 | 2 = call === 2 || assembly.call === 2 ? 2 : 1;
    const { units } = condoContext(email, assembly.condominiumId);
    const roll = votingRoll(units, assembly.condominiumId);

    return upsertAssembly(current, {
      ...assembly,
      status: "in_session",
      call: nextCall,
      attendance: normalizeAttendanceRows(assembly.attendance, roll),
    });
  });
}

export function closeAssembly(email: string, id: string): AssembliesState {
  return mutate(email, (current) => {
    const assembly = requireAssembly(current, id);
    if (assembly.status !== "in_session") throw new Error("notInSession");
    if (!assembly.minutes.text.trim()) throw new Error("minutesRequired");
    const { units, totalCapital } = condoContext(email, assembly.condominiumId);
    const roll = votingRoll(units, assembly.condominiumId);
    if (!quorumMet(assembly, roll, totalCapital)) {
      throw new Error("quorumRequired");
    }
    return upsertAssembly(current, {
      ...assembly,
      status: "closed",
      minutes: {
        ...assembly.minutes,
        recordedAt:
          assembly.minutes.recordedAt ?? new Date().toISOString().slice(0, 10),
      },
      resolutions: buildResolutions(assembly, roll, totalCapital),
    });
  });
}
