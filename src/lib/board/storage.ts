import { isIsoDate, todayKey } from "@/lib/collections/dates";
import { nextSequence, yearFromDate } from "@/lib/collections/ledger";
import type { Assembly } from "@/lib/assemblies/types";
import type { Unit } from "@/types";
import {
  boardEligibleOwnerIds,
  isBoardOffice,
  normalizeSeatInputs,
  termLengthValid,
} from "./rules";
import {
  EMPTY_BOARD,
  type BoardMandate,
  type BoardSeat,
  type BoardState,
  type RecordMandateInput,
  type SeatInput,
  type UpdateMandateInput,
} from "./types";

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((row) => row.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function nowIso(): string {
  return new Date().toISOString();
}

function formatMandateNumber(year: number, sequence: number): string {
  return `MD-${year}-${String(sequence).padStart(4, "0")}`;
}

function normalizeSeat(seat: BoardSeat): BoardSeat {
  const office = isBoardOffice(seat.office) ? seat.office : "vogal";
  return {
    id: seat.id || crypto.randomUUID(),
    ownerId: seat.ownerId,
    office,
    canSignSummons: Boolean(seat.canSignSummons) || office === "presidente",
  };
}

export function normalizeMandate(mandate: BoardMandate): BoardMandate {
  const startsOn = isIsoDate(mandate.startsOn)
    ? mandate.startsOn.slice(0, 10)
    : todayKey();
  const endsOn = isIsoDate(mandate.endsOn)
    ? mandate.endsOn.slice(0, 10)
    : startsOn;
  return {
    id: mandate.id,
    number: mandate.number || mandate.id,
    condominiumId: mandate.condominiumId,
    startsOn,
    endsOn,
    assemblyId: mandate.assemblyId || null,
    agendaItemId: mandate.agendaItemId || null,
    resolutionId: mandate.resolutionId || null,
    seats: Array.isArray(mandate.seats)
      ? mandate.seats.map(normalizeSeat)
      : [],
    notes: mandate.notes?.trim() ?? "",
    supersededBy: mandate.supersededBy || null,
    createdAt: mandate.createdAt || nowIso(),
    updatedAt: mandate.updatedAt || mandate.createdAt || nowIso(),
  };
}

export function normalizeBoard(parsed: BoardState | undefined): BoardState {
  if (!parsed) return { ...EMPTY_BOARD };
  return {
    mandates: Array.isArray(parsed.mandates)
      ? parsed.mandates.map(normalizeMandate)
      : [],
    seqByYear: parsed.seqByYear ?? {},
  };
}

function requireDates(startsOn: string, endsOn: string): void {
  if (!isIsoDate(startsOn) || !isIsoDate(endsOn)) {
    throw new Error("invalidDate");
  }
  if (endsOn <= startsOn) throw new Error("termInverted");
  if (!termLengthValid(startsOn, endsOn)) throw new Error("termTooLong");
}

function seatsFromInput(
  seats: SeatInput[],
  units: Unit[],
  condominiumId: string,
): BoardSeat[] {
  return normalizeSeatInputs(
    seats,
    boardEligibleOwnerIds(units, condominiumId),
  );
}

/** Mark open overlapping terms on the same building as superseded. */
function supersedeOverlapping(
  mandates: BoardMandate[],
  incoming: BoardMandate,
): BoardMandate[] {
  return mandates.map((row) => {
    if (row.id === incoming.id) return row;
    if (row.condominiumId !== incoming.condominiumId) return row;
    if (row.supersededBy) return row;
    const overlaps =
      row.startsOn <= incoming.endsOn && incoming.startsOn <= row.endsOn;
    if (!overlaps) return row;
    return {
      ...row,
      supersededBy: incoming.id,
      updatedAt: incoming.updatedAt,
    };
  });
}

export function recordMandate(
  state: BoardState,
  input: RecordMandateInput,
  ctx: { units: Unit[]; assembly?: Assembly | null },
): BoardState {
  if (!input.condominiumId) throw new Error("condominiumNotFound");
  const startsOn = input.startsOn?.slice(0, 10) ?? "";
  const endsOn = input.endsOn?.slice(0, 10) ?? "";
  requireDates(startsOn, endsOn);

  if (input.assemblyId) {
    if (!ctx.assembly || ctx.assembly.id !== input.assemblyId) {
      throw new Error("assemblyNotFound");
    }
    if (ctx.assembly.condominiumId !== input.condominiumId) {
      throw new Error("assemblyNotFound");
    }
  }

  const seats = seatsFromInput(input.seats, ctx.units, input.condominiumId);
  const year = yearFromDate(startsOn);
  const sequenced = nextSequence(state.seqByYear, year);
  const now = nowIso();
  const mandate = normalizeMandate({
    id: crypto.randomUUID(),
    number: formatMandateNumber(year, sequenced.sequence),
    condominiumId: input.condominiumId,
    startsOn,
    endsOn,
    assemblyId: input.assemblyId ?? null,
    agendaItemId: input.agendaItemId ?? null,
    resolutionId: input.resolutionId ?? null,
    seats,
    notes: input.notes?.trim() ?? "",
    supersededBy: null,
    createdAt: now,
    updatedAt: now,
  });

  const withIncoming = [mandate, ...state.mandates];
  return {
    mandates: supersedeOverlapping(withIncoming, mandate),
    seqByYear: sequenced.seqByYear,
  };
}

export function updateMandate(
  state: BoardState,
  input: UpdateMandateInput,
  ctx: { units: Unit[] },
): BoardState {
  const existing = state.mandates.find((row) => row.id === input.id);
  if (!existing) throw new Error("mandateNotFound");
  if (existing.supersededBy) throw new Error("mandateLocked");

  const startsOn = (input.startsOn ?? existing.startsOn).slice(0, 10);
  const endsOn = (input.endsOn ?? existing.endsOn).slice(0, 10);
  requireDates(startsOn, endsOn);

  const seats = input.seats
    ? seatsFromInput(input.seats, ctx.units, existing.condominiumId)
    : existing.seats;

  const next = normalizeMandate({
    ...existing,
    startsOn,
    endsOn,
    seats,
    notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
    updatedAt: nowIso(),
  });

  const replaced = upsertById(state.mandates, next);
  return {
    ...state,
    mandates: supersedeOverlapping(replaced, next),
  };
}

export function removeMandate(state: BoardState, id: string): BoardState {
  const existing = state.mandates.find((row) => row.id === id);
  if (!existing) throw new Error("mandateNotFound");
  if (existing.supersededBy) throw new Error("mandateLocked");
  return {
    ...state,
    mandates: state.mandates
      .filter((row) => row.id !== id)
      .map((row) =>
        row.supersededBy === id ? { ...row, supersededBy: null } : row,
      ),
  };
}
