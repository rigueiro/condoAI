import { formatPermillage } from "@/lib/portfolio/units";
import {
  attendanceByOwnerId,
  attendingPermillage,
  buildResolutions,
  isAttending,
  quorumMet,
} from "./rules";
import { TOTAL_CAPITAL, type Assembly, type AssemblyResolution, type AttendanceStatus, type VotingShare } from "./types";

export type MinutesOwnerLookup = (ownerId: string) => string;

export type MinutesPackageAttendance = {
  ownerId: string;
  name: string;
  status: AttendanceStatus;
  permillage: number;
  proxyName: string | null;
};

export type MinutesPackage = {
  assemblyId: string;
  title: string;
  type: Assembly["type"];
  condominiumName: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  call: 1 | 2;
  recordedAt: string | null;
  narrative: string;
  file: string | null;
  attendingPermillage: number;
  totalCapital: number;
  quorumMet: boolean;
  attendance: MinutesPackageAttendance[];
  resolutions: AssemblyResolution[];
};

export type MinutesPackageInput = {
  assembly: Assembly;
  roll: VotingShare[];
  condominiumName: string;
  ownerName: MinutesOwnerLookup;
  totalCapital?: number;
};

/** Snapshot used for print / export — live tallies in session, stored resolutions when closed. */
export function buildMinutesPackage(
  input: MinutesPackageInput,
): MinutesPackage {
  const { assembly, roll, condominiumName, ownerName } = input;
  const capital = input.totalCapital ?? TOTAL_CAPITAL;
  const byOwner = attendanceByOwnerId(assembly.attendance);

  const attendance: MinutesPackageAttendance[] = roll.map((share) => {
    const row = byOwner.get(share.ownerId);
    const status = row?.status ?? "absent";
    const proxyId =
      status === "represented" ? row?.representedByOwnerId : null;
    return {
      ownerId: share.ownerId,
      name: ownerName(share.ownerId),
      status,
      permillage: share.permillage,
      proxyName: proxyId && isAttending(row) ? ownerName(proxyId) : null,
    };
  });

  const resolutions =
    assembly.status === "closed" && assembly.resolutions.length > 0
      ? assembly.resolutions
      : buildResolutions(assembly, roll, capital);

  return {
    assemblyId: assembly.id,
    title: assembly.title,
    type: assembly.type,
    condominiumName,
    scheduledDate: assembly.scheduledDate,
    scheduledTime: assembly.scheduledTime,
    location: assembly.location,
    call: assembly.call,
    recordedAt: assembly.minutes.recordedAt,
    narrative: assembly.minutes.text.trim(),
    file: assembly.minutes.file,
    attendingPermillage: attendingPermillage(assembly, roll),
    totalCapital: capital,
    quorumMet: quorumMet(assembly, roll, capital),
    attendance,
    resolutions,
  };
}

/**
 * Portuguese draft notes from attendance + provisional resolutions.
 * Structured detail also lives in the printable package; this seeds the editable acta.
 */
export function defaultMinutesNotes(input: MinutesPackageInput): string {
  const pack = buildMinutesPackage(input);
  const byOwner = attendanceByOwnerId(input.assembly.attendance);

  const attendanceLines = pack.attendance
    .filter((row) => isAttending(byOwner.get(row.ownerId)))
    .map((row) => {
      const weight = formatPermillage(row.permillage);
      if (row.status === "represented" && row.proxyName) {
        return `- ${row.name} (${weight}), representado por ${row.proxyName}`;
      }
      return `- ${row.name} (${weight}), presente`;
    });

  const deliberationLines = pack.resolutions.map((resolution, index) => {
    const outcome = resolution.passed ? "Aprovado" : "Rejeitado";
    const detail =
      resolution.text !== resolution.title ? `   ${resolution.text}\n` : "";
    return `${index + 1}. ${resolution.title}\n${detail}   Votação: ${formatPermillage(resolution.forPermillage)} a favor · ${formatPermillage(resolution.againstPermillage)} contra · ${formatPermillage(resolution.abstainPermillage)} abstenções — ${outcome}.`;
  });

  return [
    `Acta da assembleia "${pack.title}" do condomínio ${pack.condominiumName}.`,
    `Reunião em ${pack.scheduledDate} às ${pack.scheduledTime}, em ${pack.location}, em ${pack.call === 2 ? "segunda" : "primeira"} convocatória.`,
    "",
    "Presenças:",
    ...(attendanceLines.length > 0
      ? attendanceLines
      : ["- (nenhum condómino presente ou validamente representado)"]),
    `Permilagem presente: ${formatPermillage(pack.attendingPermillage)} de ${formatPermillage(pack.totalCapital)}. Quórum: ${pack.quorumMet ? "cumprido" : "não cumprido"}.`,
    "",
    "Deliberações:",
    ...(deliberationLines.length > 0
      ? deliberationLines
      : ["- (sem pontos na ordem de trabalhos)"]),
    "",
    "A acta foi lida e aprovada em minuta.",
  ].join("\n");
}
