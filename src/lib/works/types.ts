import type { Intervention } from "@/types";

export const WORKS_CATEGORIES = [
  "facade",
  "elevator",
  "roof",
  "common-area",
  "other",
] as const;

export type WorksCategory = (typeof WORKS_CATEGORIES)[number];

export const WORKS_STATUSES = [
  "draft",
  "quoting",
  "pending_vote",
  "approved",
  "rejected",
  "funded",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type WorksStatus = (typeof WORKS_STATUSES)[number];

export const PIPELINE_STEPS = [
  "quotes",
  "assembly",
  "quota",
  "vendor",
  "worklog",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export type PipelineStepState = "done" | "current" | "blocked" | "failed";

export interface WorksQuote {
  id: string;
  vendorId: string;
  amount: number;
  description: string;
  receivedAt: string;
  validUntil: string | null;
  document: string | null;
}

export interface WorksProject {
  id: string;
  number: string;
  condominiumId: string;
  title: string;
  description: string;
  category: WorksCategory;
  location: string;
  status: WorksStatus;
  quotes: WorksQuote[];
  awardedQuoteId: string | null;
  assemblyId: string | null;
  agendaItemId: string | null;
  resolutionId: string | null;
  resolutionPassed: boolean | null;
  extraordinaryQuotaId: string | null;
  vendorId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorksState {
  projects: WorksProject[];
  interventions: Intervention[];
  seqByYear: Record<string, number>;
}

export const EMPTY_WORKS: WorksState = {
  projects: [],
  interventions: [],
  seqByYear: {},
};

export type CreateWorksProjectInput = {
  condominiumId: string;
  title: string;
  description?: string;
  category?: WorksCategory;
  location?: string;
  notes?: string;
};

export type UpdateWorksProjectInput = {
  id: string;
  title?: string;
  description?: string;
  category?: WorksCategory;
  location?: string;
  notes?: string;
};

export type AddWorksQuoteInput = {
  projectId: string;
  vendorId: string;
  amount: number | string;
  description?: string;
  receivedAt?: string;
  validUntil?: string | null;
  document?: string | null;
};

export type LinkAssemblyInput = {
  projectId: string;
  assemblyId: string;
  agendaItemId: string;
};

export type IssueWorksQuotaInput = {
  projectId: string;
  description?: string;
  totalAmount?: number | string;
  date?: string;
  dueDate?: string;
};

export type AddInterventionInput = {
  projectId: string;
  date?: string;
  description: string;
  cost?: number | string;
  vendorId?: string | null;
  company?: string;
  photos?: string[];
};

export const WORKS_ERROR_CODES = new Set([
  "notFound",
  "projectNotFound",
  "quoteNotFound",
  "interventionNotFound",
  "condominiumNotFound",
  "assemblyNotFound",
  "agendaRequired",
  "vendorRequired",
  "invalidAmount",
  "noQuotes",
  "resolutionRequired",
  "resolutionRejected",
  "alreadyIssued",
  "alreadyAwarded",
  "alreadyComplete",
  "alreadyCancelled",
  "hasQuota",
  "hasWorkLog",
  "workLogRequired",
  "vendorRequiredForLog",
  "noBilledOwners",
  "requestFailed",
]);
