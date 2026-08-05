import type { Condominium } from "@/types";
import type { AttentionItem, ComplianceState } from "./types";

const DUE_SOON_DAYS = 60;

function toDateOnly(value: Date | string): string {
  return String(value).slice(0, 10);
}

function daysUntil(dueDate: string, now: Date): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildAttentionItems(
  state: ComplianceState,
  condominiums: Condominium[],
  now = new Date(),
): AttentionItem[] {
  const nameById = new Map(condominiums.map((c) => [c.id, c.name]));

  const fromPolicies: AttentionItem[] = state.policies.flatMap((p) => {
    const dueDate = toDateOnly(p.renewalDate);
    const days = daysUntil(dueDate, now);
    if (days > DUE_SOON_DAYS) return [];
    return [
      {
        id: p.id,
        kind: "insurance" as const,
        condominiumId: p.condominiumId,
        condominiumName: nameById.get(p.condominiumId) ?? p.condominiumId,
        title: p.insurer,
        detail: p.number,
        dueDate,
        daysUntil: days,
        urgency: days < 0 ? ("overdue" as const) : ("due-soon" as const),
      },
    ];
  });

  const fromCertificates: AttentionItem[] = state.certificates.flatMap((c) => {
    const dueDate = toDateOnly(c.validity);
    const days = daysUntil(dueDate, now);
    if (days > DUE_SOON_DAYS) return [];
    return [
      {
        id: c.id,
        kind: "certificate" as const,
        condominiumId: c.condominiumId,
        condominiumName: nameById.get(c.condominiumId) ?? c.condominiumId,
        title: c.type,
        detail: c.type,
        dueDate,
        daysUntil: days,
        urgency: days < 0 ? ("overdue" as const) : ("due-soon" as const),
      },
    ];
  });

  return [...fromPolicies, ...fromCertificates].sort(
    (a, b) => a.daysUntil - b.daysUntil,
  );
}
