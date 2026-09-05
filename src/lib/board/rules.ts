import type { Assembly, AssemblyResolution } from "@/lib/assemblies/types";
import { addCalendarMonths, isIsoDate, todayKey } from "@/lib/collections/dates";
import type { Owner, Unit } from "@/types";
import {
  BOARD_OFFICES,
  DEFAULT_TERM_MONTHS,
  EXPIRING_SOON_DAYS,
  MAX_TERM_YEARS,
  OFFICE_SUMMONS_LABEL,
  type BoardMandate,
  type BoardOffice,
  type BoardSeat,
  type MandateStatus,
  type SeatInput,
} from "./types";

const ELECTION_RE =
  /elei[cç][aã]o|election|administrador|administra[cç][aã]o|mandato|\bboard\b/i;

export function isBoardOffice(value: string): value is BoardOffice {
  return (BOARD_OFFICES as readonly string[]).includes(value);
}

export function defaultTermEnd(startsOn: string): string {
  return addCalendarMonths(startsOn, DEFAULT_TERM_MONTHS);
}

export function daysUntil(isoDate: string, today = todayKey()): number {
  const from = today.slice(0, 10).split("-").map(Number);
  const to = isoDate.slice(0, 10).split("-").map(Number);
  if (from.length < 3 || to.length < 3) return 0;
  const start = Date.UTC(from[0], from[1] - 1, from[2]);
  const end = Date.UTC(to[0], to[1] - 1, to[2]);
  return Math.round((end - start) / 86_400_000);
}

export function mandateStatus(
  mandate: BoardMandate,
  today = todayKey(),
): MandateStatus {
  if (mandate.supersededBy) return "superseded";
  if (today < mandate.startsOn) return "upcoming";
  if (today > mandate.endsOn) return "expired";
  return "active";
}

export function isMandateOpen(
  mandate: BoardMandate,
  today = todayKey(),
): boolean {
  const status = mandateStatus(mandate, today);
  return status === "active" || status === "upcoming";
}

export function officeRank(office: BoardOffice): number {
  if (office === "presidente") return 0;
  if (office === "secretario") return 1;
  return 2;
}

export function sortedSeats(seats: BoardSeat[]): BoardSeat[] {
  return [...seats].sort((a, b) => {
    const rank = officeRank(a.office) - officeRank(b.office);
    if (rank !== 0) return rank;
    return a.id.localeCompare(b.id);
  });
}

export function presidenteSeat(mandate: BoardMandate): BoardSeat | null {
  return mandate.seats.find((seat) => seat.office === "presidente") ?? null;
}

export function summonsSigners(mandate: BoardMandate): BoardSeat[] {
  return sortedSeats(mandate.seats.filter((seat) => seat.canSignSummons));
}

export function defaultSigner(mandate: BoardMandate): BoardSeat | null {
  const signers = summonsSigners(mandate);
  if (signers.length > 0) return signers[0];
  return presidenteSeat(mandate);
}

export function isElectionAgendaItem(item: {
  title: string;
  description?: string;
}): boolean {
  return ELECTION_RE.test(`${item.title} ${item.description ?? ""}`);
}

export function electionResolutions(assembly: Assembly): AssemblyResolution[] {
  const electionIds = new Set(
    assembly.agenda.filter(isElectionAgendaItem).map((item) => item.id),
  );
  return assembly.resolutions.filter((row) => electionIds.has(row.itemId));
}

export function passedElectionResolution(
  assembly: Assembly,
): AssemblyResolution | null {
  return electionResolutions(assembly).find((row) => row.passed) ?? null;
}

export function needsMandateRecording(
  assembly: Assembly,
  mandates: BoardMandate[],
): boolean {
  if (assembly.status !== "closed") return false;
  if (!passedElectionResolution(assembly)) return false;
  return !mandates.some((row) => row.assemblyId === assembly.id);
}

export function boardEligibleOwnerIds(
  units: Unit[],
  condominiumId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const unit of units) {
    if (unit.condominiumId !== condominiumId) continue;
    for (const occupancy of unit.occupancies ?? []) {
      if (occupancy.role === "owner") ids.add(occupancy.ownerId);
    }
  }
  return ids;
}

export function boardEligibleOwners(
  units: Unit[],
  owners: Owner[],
  condominiumId: string,
): Owner[] {
  const ids = boardEligibleOwnerIds(units, condominiumId);
  return owners
    .filter((owner) => ids.has(owner.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt"));
}

export function termLengthValid(startsOn: string, endsOn: string): boolean {
  if (!isIsoDate(startsOn) || !isIsoDate(endsOn)) return false;
  if (endsOn <= startsOn) return false;
  const maxEnd = addCalendarMonths(startsOn, MAX_TERM_YEARS * 12);
  return endsOn <= maxEnd;
}

export function normalizeSeatInputs(
  seats: SeatInput[],
  eligibleIds: Set<string> | null,
): BoardSeat[] {
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new Error("presidenteRequired");
  }

  const seen = new Set<string>();
  const presidentes: BoardSeat[] = [];
  const normalized: BoardSeat[] = [];

  for (const seat of seats) {
    const ownerId = seat.ownerId?.trim() ?? "";
    if (!ownerId) throw new Error("ownerRequired");
    if (eligibleIds && !eligibleIds.has(ownerId)) {
      throw new Error("ownerNotEligible");
    }
    if (seen.has(ownerId)) throw new Error("duplicateOwner");
    seen.add(ownerId);
    if (!isBoardOffice(seat.office)) throw new Error("presidenteRequired");

    const row: BoardSeat = {
      id: crypto.randomUUID(),
      ownerId,
      office: seat.office,
      canSignSummons: seat.canSignSummons ?? seat.office === "presidente",
    };
    if (row.office === "presidente") presidentes.push(row);
    normalized.push(row);
  }

  if (presidentes.length === 0) throw new Error("presidenteRequired");
  if (presidentes.length > 1) throw new Error("singlePresidente");

  if (!normalized.some((seat) => seat.canSignSummons)) {
    presidentes[0].canSignSummons = true;
  }

  return normalized;
}

export function formatSummonsSignature(
  signerName: string | null,
  office: BoardOffice | "administrador",
): string {
  const name = signerName?.trim();
  const title = OFFICE_SUMMONS_LABEL[office];
  if (!name) return `\n\n—\n${title}`;
  return `\n\n—\n${name}\n${title}`;
}

export function mandateAttentionKind(
  mandate: BoardMandate | null,
  today = todayKey(),
): "missing" | "expired" | "expiring" | null {
  if (!mandate) return "missing";
  const status = mandateStatus(mandate, today);
  if (status === "expired" || status === "superseded") return "expired";
  if (status === "upcoming") return null;
  const remaining = daysUntil(mandate.endsOn, today);
  if (remaining <= EXPIRING_SOON_DAYS) return "expiring";
  return null;
}
