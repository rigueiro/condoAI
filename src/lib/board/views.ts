import { todayKey } from "@/lib/collections/dates";
import type { Condominium, Owner } from "@/types";
import {
  mandateAttentionKind,
  mandateStatus,
  presidenteSeat,
} from "./rules";
import type { BoardMandate, MandateStatus } from "./types";

export type MandateAttentionItem = {
  id: string;
  condominiumId: string;
  condominiumName: string;
  kind: "missing" | "expired" | "expiring";
  mandateId: string | null;
  endsOn: string | null;
  presidenteName: string | null;
};

export function mandatesForCondominium(
  mandates: BoardMandate[],
  condominiumId: string,
): BoardMandate[] {
  return mandates
    .filter((row) => row.condominiumId === condominiumId)
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn));
}

export function currentMandate(
  mandates: BoardMandate[],
  condominiumId: string,
  today = todayKey(),
): BoardMandate | null {
  const rows = mandatesForCondominium(mandates, condominiumId);
  return (
    rows.find((row) => mandateStatus(row, today) === "active") ??
    rows.find((row) => mandateStatus(row, today) === "upcoming") ??
    null
  );
}

export function buildMandateAttention(
  mandates: BoardMandate[],
  condominiums: Condominium[],
  owners: Owner[],
  today = todayKey(),
): MandateAttentionItem[] {
  const names = new Map(owners.map((owner) => [owner.id, owner.fullName]));
  const items: MandateAttentionItem[] = [];

  for (const condo of condominiums) {
    const current = currentMandate(mandates, condo.id, today);
    const kind = mandateAttentionKind(current, today);
    if (!kind) continue;
    const presidente = current ? presidenteSeat(current) : null;
    items.push({
      id: current?.id ?? `missing-${condo.id}`,
      condominiumId: condo.id,
      condominiumName: condo.name,
      kind,
      mandateId: current?.id ?? null,
      endsOn: current?.endsOn ?? null,
      presidenteName: presidente
        ? (names.get(presidente.ownerId) ?? null)
        : null,
    });
  }

  return items.sort((a, b) => {
    const rank = { expired: 0, missing: 1, expiring: 2 } as const;
    const byKind = rank[a.kind] - rank[b.kind];
    if (byKind !== 0) return byKind;
    return (a.endsOn ?? "").localeCompare(b.endsOn ?? "");
  });
}

export function statusTone(status: MandateStatus): string {
  if (status === "active") return "bg-success-50 text-success";
  if (status === "upcoming") return "bg-primary-50 text-primary";
  if (status === "expired") return "bg-warning-50 text-warning";
  return "bg-secondary-100 text-text-secondary";
}
