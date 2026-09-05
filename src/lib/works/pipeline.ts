import type { Assembly, AssemblyResolution } from "@/lib/assemblies/types";
import {
  PIPELINE_STEPS,
  type PipelineStep,
  type PipelineStepState,
  type WorksProject,
  type WorksStatus,
} from "./types";

export function interventionCountFor(
  projectId: string,
  interventions: { projectId?: string | null }[],
): number {
  return interventions.filter((row) => row.projectId === projectId).length;
}

export function deriveWorksStatus(
  project: Pick<
    WorksProject,
    | "status"
    | "quotes"
    | "assemblyId"
    | "resolutionPassed"
    | "extraordinaryQuotaId"
  >,
  interventionCount: number,
): WorksStatus {
  if (project.status === "cancelled" || project.status === "completed") {
    return project.status;
  }
  if (interventionCount > 0) return "in_progress";
  if (project.extraordinaryQuotaId) return "funded";
  if (project.resolutionPassed === false) return "rejected";
  if (project.resolutionPassed === true) return "approved";
  if (project.assemblyId) return "pending_vote";
  if (project.quotes.length > 0) return "quoting";
  return "draft";
}

export function withDerivedStatus(
  project: WorksProject,
  interventionCount: number,
): WorksProject {
  const status = deriveWorksStatus(project, interventionCount);
  return status === project.status ? project : { ...project, status };
}

export function resolutionForProject(
  project: Pick<WorksProject, "assemblyId" | "agendaItemId">,
  assembly: Assembly | null | undefined,
): AssemblyResolution | null {
  if (!assembly || assembly.id !== project.assemblyId) return null;
  if (project.agendaItemId) {
    return (
      assembly.resolutions.find((row) => row.itemId === project.agendaItemId) ??
      null
    );
  }
  return assembly.resolutions[0] ?? null;
}

/** Stamp resolution outcome when the linked assembly closes. */
export function applyAssemblyClose(
  project: WorksProject,
  assembly: Assembly,
): WorksProject {
  if (project.assemblyId !== assembly.id) return project;
  if (project.status === "cancelled" || project.status === "completed") {
    return project;
  }
  const resolution = resolutionForProject(project, assembly);
  if (!resolution) return project;
  return {
    ...project,
    resolutionId: resolution.id,
    resolutionPassed: resolution.passed,
    updatedAt: new Date().toISOString(),
  };
}

export function awardedQuote(project: WorksProject) {
  if (!project.awardedQuoteId) return null;
  return project.quotes.find((quote) => quote.id === project.awardedQuoteId) ?? null;
}

export function quoteAmountForIssue(project: WorksProject): number | null {
  const quote = awardedQuote(project);
  return quote && quote.amount > 0 ? quote.amount : null;
}

export function isWorksOpen(project: Pick<WorksProject, "status">): boolean {
  return project.status !== "cancelled" && project.status !== "completed";
}

export function closedStatusError(project: Pick<WorksProject, "status">): never {
  throw new Error(
    project.status === "cancelled" ? "alreadyCancelled" : "alreadyComplete",
  );
}

export function canAddQuote(project: WorksProject): boolean {
  return isWorksOpen(project);
}

export function canAwardQuote(project: WorksProject): boolean {
  return project.quotes.length > 0 && isWorksOpen(project) && project.status !== "rejected";
}

export function canLinkAssembly(project: WorksProject): boolean {
  return isWorksOpen(project);
}

export function canIssueQuota(project: WorksProject): boolean {
  return (
    project.resolutionPassed === true &&
    !project.extraordinaryQuotaId &&
    isWorksOpen(project)
  );
}

export function canLogWork(project: WorksProject): boolean {
  return Boolean(project.vendorId) && isWorksOpen(project);
}

export function canComplete(
  project: WorksProject,
  interventionCount: number,
): boolean {
  return interventionCount > 0 && isWorksOpen(project);
}

export function canCancel(project: WorksProject): boolean {
  return isWorksOpen(project);
}

export function canDeleteProject(
  project: WorksProject,
  interventionCount: number,
): boolean {
  return !project.extraordinaryQuotaId && interventionCount === 0;
}

export function pipelineStepState(
  step: PipelineStep,
  project: WorksProject,
  interventionCount: number,
): PipelineStepState {
  if (project.status === "cancelled") {
    if (step === "assembly" && project.resolutionPassed === false) {
      return "failed";
    }
    if (step === "quotes" && project.quotes.length > 0) return "done";
    if (step === "quota" && project.extraordinaryQuotaId) return "done";
    if (step === "vendor" && project.vendorId) return "done";
    if (step === "worklog" && interventionCount > 0) return "done";
    return step === "quotes" ? "current" : "blocked";
  }

  switch (step) {
    case "quotes":
      if (project.quotes.length > 0) return "done";
      return "current";
    case "assembly":
      if (project.resolutionPassed === false) return "failed";
      if (project.resolutionPassed === true) return "done";
      if (project.assemblyId) return "current";
      return project.quotes.length > 0 ? "current" : "blocked";
    case "quota":
      if (project.extraordinaryQuotaId) return "done";
      if (project.resolutionPassed === true) return "current";
      return "blocked";
    case "vendor":
      if (project.vendorId) return "done";
      if (project.quotes.length > 0 && project.status !== "rejected") {
        return "current";
      }
      return "blocked";
    case "worklog":
      if (project.status === "completed") return "done";
      if (project.vendorId) return "current";
      return "blocked";
  }
}

export function pipelineStates(
  project: WorksProject,
  interventionCount: number,
): Record<PipelineStep, PipelineStepState> {
  return Object.fromEntries(
    PIPELINE_STEPS.map((step) => [
      step,
      pipelineStepState(step, project, interventionCount),
    ]),
  ) as Record<PipelineStep, PipelineStepState>;
}
