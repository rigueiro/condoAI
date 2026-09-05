import type { Condominium, Intervention } from "@/types";
import { awardedQuote } from "./pipeline";
import type { WorksProject, WorksStatus } from "./types";

export type WorksProjectRow = {
  project: WorksProject;
  condominiumName: string;
  vendorName: string | null;
  awardedAmount: number | null;
  interventionCount: number;
  loggedCost: number;
};

export function worksForCondominium(
  projects: WorksProject[],
  condominiumId: string,
): WorksProject[] {
  return projects.filter((project) => project.condominiumId === condominiumId);
}

export function interventionsForProject(
  interventions: Intervention[],
  projectId: string,
): Intervention[] {
  return interventions.filter((row) => row.projectId === projectId);
}

export function worksVendorIds(
  projects: WorksProject[],
  interventions: { vendorId?: string | null }[],
): (string | null | undefined)[] {
  const ids: (string | null | undefined)[] = [];
  for (const project of projects) {
    ids.push(project.vendorId);
    for (const quote of project.quotes) ids.push(quote.vendorId);
  }
  for (const row of interventions) ids.push(row.vendorId);
  return ids;
}

export function toWorksProjectRows(
  projects: WorksProject[],
  condominiums: Pick<Condominium, "id" | "name">[],
  vendorNames: Map<string, string>,
  interventions: Intervention[],
): WorksProjectRow[] {
  const condoById = new Map(condominiums.map((row) => [row.id, row.name]));
  return projects.map((project) => {
    const logs = interventionsForProject(interventions, project.id);
    return {
      project,
      condominiumName:
        condoById.get(project.condominiumId) ?? project.condominiumId,
      vendorName: project.vendorId
        ? (vendorNames.get(project.vendorId) ?? null)
        : null,
      awardedAmount: awardedQuote(project)?.amount ?? null,
      interventionCount: logs.length,
      loggedCost: logs.reduce((sum, row) => sum + (Number(row.cost) || 0), 0),
    };
  });
}

export function statusTone(status: WorksStatus): string {
  if (status === "completed") return "bg-success-50 text-success";
  if (status === "in_progress" || status === "funded") {
    return "bg-primary-50 text-primary";
  }
  if (status === "approved") return "bg-accent-50 text-accent-700";
  if (status === "rejected" || status === "cancelled") {
    return "bg-error-50 text-error";
  }
  if (status === "pending_vote") return "bg-warning-50 text-warning";
  return "bg-secondary-100 text-text-secondary";
}

export function worksMatchesSearch(row: WorksProjectRow, query: string): boolean {
  if (!query) return true;
  const { project, condominiumName, vendorName } = row;
  return `${project.number} ${project.title} ${project.location} ${condominiumName} ${vendorName ?? ""}`
    .toLowerCase()
    .includes(query);
}
