import type { Unit } from "@/types";
import { roundPermillage } from "@/lib/portfolio/units";
import {
  LEGAL_NOTICE_DAYS,
  QUALIFIED_MAJORITY,
  TOTAL_CAPITAL,
  type AgendaItem,
  type Assembly,
  type AssemblyResolution,
  type AssemblySummons,
  type AttendanceRecord,
  type AttendanceStatus,
  type ItemVotes,
  type VoteTally,
  type VotingShare,
} from "./types";

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function calendarDaysBetween(from: string, to: string): number | null {
  const start = new Date(`${dateOnly(from)}T00:00:00`);
  const end = new Date(`${dateOnly(to)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function noticeDays(assembly: Assembly): number | null {
  if (!assembly.summons?.sentDate) return null;
  return calendarDaysBetween(
    assembly.summons.sentDate,
    assembly.scheduledDate,
  );
}

export function noticeSatisfied(assembly: Assembly): boolean {
  const days = noticeDays(assembly);
  return days != null && days >= LEGAL_NOTICE_DAYS;
}

/** Owners with role `owner` and the permillage they vote. Tenants do not vote. */
export function votingRoll(
  units: Unit[],
  condominiumId: string,
): VotingShare[] {
  const byOwner = new Map<string, VotingShare>();
  for (const unit of units) {
    if (unit.condominiumId !== condominiumId) continue;
    const permillage = Number(unit.permillage) || 0;
    if (permillage <= 0) continue;
    for (const occupancy of unit.occupancies ?? []) {
      if (occupancy.role !== "owner") continue;
      const current = byOwner.get(occupancy.ownerId);
      if (current) {
        current.permillage = roundPermillage(
          current.permillage + permillage,
        );
        if (!current.unitLabels.includes(unit.label)) {
          current.unitLabels.push(unit.label);
        }
      } else {
        byOwner.set(occupancy.ownerId, {
          ownerId: occupancy.ownerId,
          permillage: roundPermillage(permillage),
          unitLabels: [unit.label],
        });
      }
    }
  }
  return [...byOwner.values()].sort((a, b) => b.permillage - a.permillage);
}

export function isAttending(status: AttendanceStatus): boolean {
  return status === "present" || status === "represented";
}

export function attendanceByOwnerId(
  attendance: AttendanceRecord[],
): Map<string, AttendanceRecord> {
  return new Map(attendance.map((row) => [row.ownerId, row]));
}

export function attendingPermillage(
  assembly: Assembly,
  roll: VotingShare[],
): number {
  const byOwner = attendanceByOwnerId(assembly.attendance);
  return roundPermillage(
    roll.reduce((sum, share) => {
      const row = byOwner.get(share.ownerId);
      return row && isAttending(row.status) ? sum + share.permillage : sum;
    }, 0),
  );
}

export function firstCallQuorum(totalCapital?: number): number {
  return (totalCapital ?? TOTAL_CAPITAL) / 2;
}

export function quorumMet(
  assembly: Assembly,
  roll: VotingShare[],
  totalCapital?: number,
): boolean {
  const attending = attendingPermillage(assembly, roll);
  const capital = totalCapital ?? TOTAL_CAPITAL;
  if (assembly.call === 2) return attending > 0;
  return attending > firstCallQuorum(capital);
}

export function canVote(assembly: Assembly, ownerId: string): boolean {
  if (assembly.status !== "in_session") return false;
  const row = attendanceByOwnerId(assembly.attendance).get(ownerId);
  return Boolean(row && isAttending(row.status));
}

export function votesForItem(
  assembly: Assembly,
  itemId: string,
): ItemVotes {
  return (
    assembly.votes.find((row) => row.itemId === itemId) ?? {
      itemId,
      ballots: {},
    }
  );
}

export function tallyItem(
  assembly: Assembly,
  item: AgendaItem,
  roll: VotingShare[],
  totalCapital?: number,
): VoteTally {
  const ballots = votesForItem(assembly, item.id).ballots;
  const byOwner = attendanceByOwnerId(assembly.attendance);
  let forPermillage = 0;
  let againstPermillage = 0;
  let abstainPermillage = 0;
  let unvotedPermillage = 0;

  for (const share of roll) {
    const row = byOwner.get(share.ownerId);
    if (!row || !isAttending(row.status)) continue;
    const choice = ballots[share.ownerId];
    if (choice === "for") forPermillage += share.permillage;
    else if (choice === "against") againstPermillage += share.permillage;
    else if (choice === "abstain") abstainPermillage += share.permillage;
    else unvotedPermillage += share.permillage;
  }

  forPermillage = roundPermillage(forPermillage);
  againstPermillage = roundPermillage(againstPermillage);
  abstainPermillage = roundPermillage(abstainPermillage);
  unvotedPermillage = roundPermillage(unvotedPermillage);
  const attending = roundPermillage(
    forPermillage + againstPermillage + abstainPermillage + unvotedPermillage,
  );

  let passed = false;
  if (item.majority === "simple") {
    passed = forPermillage > againstPermillage;
  } else if (item.majority === "absolute-present") {
    passed = attending > 0 && forPermillage > attending / 2;
  } else {
    passed = forPermillage >= roundPermillage((totalCapital ?? TOTAL_CAPITAL) * QUALIFIED_MAJORITY);
  }

  return {
    itemId: item.id,
    forPermillage,
    againstPermillage,
    abstainPermillage,
    unvotedPermillage,
    passed,
  };
}

export function buildResolutions(
  assembly: Assembly,
  roll: VotingShare[],
  totalCapital?: number,
): AssemblyResolution[] {
  return [...assembly.agenda]
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const tally = tallyItem(assembly, item, roll, totalCapital);
      return {
        id: `res-${item.id}`,
        itemId: item.id,
        title: item.title,
        text: item.description.trim() || item.title,
        forPermillage: tally.forPermillage,
        againstPermillage: tally.againstPermillage,
        abstainPermillage: tally.abstainPermillage,
        passed: tally.passed,
      };
    });
}

export function emptyMinutes(): Assembly["minutes"] {
  return { text: "", file: null, recordedAt: null };
}

export function seedAttendance(roll: VotingShare[]): AttendanceRecord[] {
  return roll.map((share) => ({
    ownerId: share.ownerId,
    status: "absent" as const,
    representedByOwnerId: null,
  }));
}

export function mergeAttendance(
  existing: AttendanceRecord[],
  roll: VotingShare[],
): AttendanceRecord[] {
  const byOwner = attendanceByOwnerId(existing);
  return roll.map((share) => {
    const row = byOwner.get(share.ownerId);
    return (
      row ?? {
        ownerId: share.ownerId,
        status: "absent",
        representedByOwnerId: null,
      }
    );
  });
}

export function withVote(
  assembly: Assembly,
  itemId: string,
  ownerId: string,
  choice: ItemVotes["ballots"][string],
): Assembly {
  const current = votesForItem(assembly, itemId);
  const nextVotes = assembly.votes.filter((row) => row.itemId !== itemId);
  nextVotes.push({
    itemId,
    ballots: { ...current.ballots, [ownerId]: choice },
  });
  return { ...assembly, votes: nextVotes };
}

export function defaultSummonsContent(assembly: Assembly): string {
  const agenda = [...assembly.agenda]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => `${index + 1}. ${item.title}`)
    .join("\n");
  return [
    assembly.title,
    "",
    `${assembly.scheduledDate} ${assembly.scheduledTime}`.trim(),
    assembly.location,
    "",
    agenda,
    "",
    "Na falta de quórum, a assembleia reunirá em segunda convocatória 30 minutos depois, com os condóminos presentes.",
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trim();
}

export function buildSummons(
  input: Partial<AssemblySummons> &
    Pick<AssemblySummons, "method" | "title" | "content">,
): AssemblySummons {
  return {
    sentDate: input.sentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    method: input.method,
    title: input.title.trim(),
    content: input.content.trim(),
    proof: input.proof ?? null,
  };
}
