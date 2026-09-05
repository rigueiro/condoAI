import type { Intervention } from "@/types";
import { roundCurrency } from "@/lib/quota";
import { isIsoDate, todayKey } from "@/lib/collections/dates";
import { nextSequence, yearFromDate } from "@/lib/collections/ledger";
import type { Assembly } from "@/lib/assemblies/types";
import {
  applyAssemblyClose,
  awardedQuote,
  canAwardQuote,
  canComplete,
  canDeleteProject,
  canIssueQuota,
  canLogWork,
  closedStatusError,
  interventionCountFor,
  isWorksOpen,
  resolutionForProject,
  withDerivedStatus,
} from "./pipeline";
import {
  EMPTY_WORKS,
  WORKS_CATEGORIES,
  type AddInterventionInput,
  type AddWorksQuoteInput,
  type CreateWorksProjectInput,
  type LinkAssemblyInput,
  type UpdateWorksProjectInput,
  type WorksCategory,
  type WorksProject,
  type WorksQuote,
  type WorksState,
} from "./types";

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((row) => row.id === item.id);
  if (index === -1) return [item, ...items];
  const next = items.slice();
  next[index] = item;
  return next;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((row) => row.id !== id);
}

function isCategory(value: string | undefined): value is WorksCategory {
  return Boolean(value && WORKS_CATEGORIES.includes(value as WorksCategory));
}

function parseAmount(value: number | string | undefined): number {
  if (value == null || value === "") return NaN;
  return typeof value === "string" ? Number.parseFloat(value) : value;
}

function nowIso(): string {
  return new Date().toISOString();
}

function formatWorksNumber(year: number, sequence: number): string {
  return `OB-${year}-${String(sequence).padStart(4, "0")}`;
}

function normalizeQuote(quote: WorksQuote): WorksQuote {
  const amount = roundCurrency(Number(quote.amount) || 0);
  const receivedAt = isIsoDate(quote.receivedAt)
    ? quote.receivedAt.slice(0, 10)
    : todayKey();
  const validUntil =
    quote.validUntil && isIsoDate(quote.validUntil)
      ? quote.validUntil.slice(0, 10)
      : null;
  return {
    id: quote.id,
    vendorId: quote.vendorId,
    amount,
    description: quote.description?.trim() ?? "",
    receivedAt,
    validUntil,
    document: quote.document || null,
  };
}

function normalizeIntervention(row: Intervention): Intervention {
  return {
    id: row.id,
    condominiumId: row.condominiumId,
    projectId: row.projectId ?? null,
    vendorId: row.vendorId ?? null,
    date: String(row.date).slice(0, 10),
    description: row.description?.trim() ?? "",
    cost: roundCurrency(Number(row.cost) || 0),
    company: row.company?.trim() ?? "",
    photos: Array.isArray(row.photos) ? row.photos.filter(Boolean) : [],
  };
}

function normalizeProject(
  project: WorksProject,
  interventionCount: number,
): WorksProject {
  const quotes = Array.isArray(project.quotes)
    ? project.quotes.map(normalizeQuote)
    : [];
  const awardedQuoteId = quotes.some((quote) => quote.id === project.awardedQuoteId)
    ? project.awardedQuoteId
    : null;
  const awarded = awardedQuote({ ...project, quotes, awardedQuoteId });
  const vendorId = awarded?.vendorId ?? (awardedQuoteId ? null : (project.vendorId ?? null));
  const category = isCategory(project.category) ? project.category : "other";
  const base: WorksProject = {
    ...project,
    title: project.title?.trim() ?? "",
    description: project.description?.trim() ?? "",
    category,
    location: project.location?.trim() ?? "",
    quotes,
    awardedQuoteId,
    assemblyId: project.assemblyId || null,
    agendaItemId: project.agendaItemId || null,
    resolutionId: project.resolutionId || null,
    resolutionPassed:
      project.resolutionPassed === true
        ? true
        : project.resolutionPassed === false
          ? false
          : null,
    extraordinaryQuotaId: project.extraordinaryQuotaId || null,
    vendorId,
    notes: project.notes?.trim() ?? "",
    createdAt: project.createdAt || nowIso(),
    updatedAt: project.updatedAt || project.createdAt || nowIso(),
  };
  return withDerivedStatus(base, interventionCount);
}

export function normalizeWorks(parsed: WorksState | null | undefined): WorksState {
  if (!parsed) return { ...EMPTY_WORKS };
  const interventions = Array.isArray(parsed.interventions)
    ? parsed.interventions.map(normalizeIntervention)
    : [];
  const projects = Array.isArray(parsed.projects)
    ? parsed.projects.map((project) =>
        normalizeProject(
          project,
          interventionCountFor(project.id, interventions),
        ),
      )
    : [];
  return {
    projects,
    interventions,
    seqByYear:
      parsed.seqByYear && typeof parsed.seqByYear === "object"
        ? parsed.seqByYear
        : {},
  };
}

function requireProject(state: WorksState, id: string): WorksProject {
  const project = state.projects.find((row) => row.id === id);
  if (!project) throw new Error("projectNotFound");
  return project;
}

function putProject(state: WorksState, project: WorksProject): WorksState {
  const count = interventionCountFor(project.id, state.interventions);
  return {
    ...state,
    projects: upsertById(state.projects, normalizeProject(project, count)),
  };
}

export function createProject(
  state: WorksState,
  input: CreateWorksProjectInput,
  id = crypto.randomUUID(),
): WorksState {
  const condominiumId = input.condominiumId?.trim() ?? "";
  const title = input.title?.trim() ?? "";
  if (!condominiumId) throw new Error("condominiumNotFound");
  if (!title) throw new Error("badRequest");

  const createdAt = nowIso();
  const year = yearFromDate(createdAt);
  const sequenced = nextSequence(state.seqByYear, year);
  const project: WorksProject = {
    id,
    number: formatWorksNumber(year, sequenced.sequence),
    condominiumId,
    title,
    description: input.description?.trim() ?? "",
    category: isCategory(input.category) ? input.category : "other",
    location: input.location?.trim() ?? "",
    status: "draft",
    quotes: [],
    awardedQuoteId: null,
    assemblyId: null,
    agendaItemId: null,
    resolutionId: null,
    resolutionPassed: null,
    extraordinaryQuotaId: null,
    vendorId: null,
    notes: input.notes?.trim() ?? "",
    createdAt,
    updatedAt: createdAt,
  };
  return putProject({ ...state, seqByYear: sequenced.seqByYear }, project);
}

export function updateProject(
  state: WorksState,
  input: UpdateWorksProjectInput,
): WorksState {
  const current = requireProject(state, input.id);
  if (!isWorksOpen(current)) closedStatusError(current);
  return putProject(state, {
    ...current,
    title: input.title?.trim() || current.title,
    description:
      input.description != null ? input.description.trim() : current.description,
    category: isCategory(input.category) ? input.category : current.category,
    location: input.location != null ? input.location.trim() : current.location,
    notes: input.notes != null ? input.notes.trim() : current.notes,
    updatedAt: nowIso(),
  });
}

export function removeProject(state: WorksState, id: string): WorksState {
  const project = requireProject(state, id);
  const count = interventionCountFor(id, state.interventions);
  if (!canDeleteProject(project, count)) {
    if (project.extraordinaryQuotaId) throw new Error("hasQuota");
    throw new Error("hasWorkLog");
  }
  return {
    ...state,
    projects: removeById(state.projects, id),
  };
}

export function addQuote(
  state: WorksState,
  input: AddWorksQuoteInput,
): WorksState {
  const project = requireProject(state, input.projectId);
  if (!isWorksOpen(project)) closedStatusError(project);
  const vendorId = input.vendorId?.trim() ?? "";
  if (!vendorId) throw new Error("vendorRequired");
  const amount = roundCurrency(parseAmount(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalidAmount");

  const quote: WorksQuote = {
    id: crypto.randomUUID(),
    vendorId,
    amount,
    description: input.description?.trim() ?? "",
    receivedAt:
      input.receivedAt && isIsoDate(input.receivedAt)
        ? input.receivedAt.slice(0, 10)
        : todayKey(),
    validUntil:
      input.validUntil && isIsoDate(input.validUntil)
        ? input.validUntil.slice(0, 10)
        : null,
    document: input.document || null,
  };
  return putProject(state, {
    ...project,
    quotes: [quote, ...project.quotes],
    updatedAt: nowIso(),
  });
}

export function removeQuote(
  state: WorksState,
  projectId: string,
  quoteId: string,
): WorksState {
  const project = requireProject(state, projectId);
  if (!isWorksOpen(project)) closedStatusError(project);
  if (!project.quotes.some((quote) => quote.id === quoteId)) {
    throw new Error("quoteNotFound");
  }
  const quotes = project.quotes.filter((quote) => quote.id !== quoteId);
  const awardedQuoteId =
    project.awardedQuoteId === quoteId ? null : project.awardedQuoteId;
  const vendorId = awardedQuoteId
    ? (quotes.find((quote) => quote.id === awardedQuoteId)?.vendorId ?? null)
    : null;
  return putProject(state, {
    ...project,
    quotes,
    awardedQuoteId,
    vendorId,
    updatedAt: nowIso(),
  });
}

export function awardQuote(
  state: WorksState,
  projectId: string,
  quoteId: string,
): WorksState {
  const project = requireProject(state, projectId);
  if (!canAwardQuote(project)) {
    if (project.quotes.length === 0) throw new Error("noQuotes");
    if (project.status === "rejected") throw new Error("resolutionRejected");
    closedStatusError(project);
  }
  const quote = project.quotes.find((row) => row.id === quoteId);
  if (!quote) throw new Error("quoteNotFound");
  return putProject(state, {
    ...project,
    awardedQuoteId: quote.id,
    vendorId: quote.vendorId,
    updatedAt: nowIso(),
  });
}

export function linkAssembly(
  state: WorksState,
  input: LinkAssemblyInput,
  assembly: Assembly,
): WorksState {
  const project = requireProject(state, input.projectId);
  if (!isWorksOpen(project)) closedStatusError(project);
  if (assembly.condominiumId !== project.condominiumId) {
    throw new Error("assemblyNotFound");
  }
  const agendaItemId = input.agendaItemId?.trim() ?? "";
  if (!agendaItemId || !assembly.agenda.some((item) => item.id === agendaItemId)) {
    throw new Error("agendaRequired");
  }

  const linked: WorksProject = {
    ...project,
    assemblyId: assembly.id,
    agendaItemId,
    resolutionId: null,
    resolutionPassed: null,
    updatedAt: nowIso(),
  };
  const resolution = resolutionForProject(linked, assembly);
  if (resolution) {
    linked.resolutionId = resolution.id;
    linked.resolutionPassed = resolution.passed;
  }
  return putProject(state, linked);
}

export function unlinkAssembly(state: WorksState, projectId: string): WorksState {
  const project = requireProject(state, projectId);
  if (!isWorksOpen(project)) closedStatusError(project);
  if (project.extraordinaryQuotaId) throw new Error("hasQuota");
  return putProject(state, {
    ...project,
    assemblyId: null,
    agendaItemId: null,
    resolutionId: null,
    resolutionPassed: null,
    updatedAt: nowIso(),
  });
}

export function attachExtraordinaryQuota(
  state: WorksState,
  projectId: string,
  extraordinaryQuotaId: string,
): WorksState {
  const project = requireProject(state, projectId);
  if (!canIssueQuota(project)) {
    if (project.extraordinaryQuotaId) throw new Error("alreadyIssued");
    if (project.resolutionPassed === false) throw new Error("resolutionRejected");
    throw new Error("resolutionRequired");
  }
  return putProject(state, {
    ...project,
    extraordinaryQuotaId,
    updatedAt: nowIso(),
  });
}

export function addIntervention(
  state: WorksState,
  input: AddInterventionInput,
  vendorName: string,
): WorksState {
  const project = requireProject(state, input.projectId);
  if (!canLogWork(project)) {
    if (!project.vendorId) throw new Error("vendorRequiredForLog");
    closedStatusError(project);
  }
  const description = input.description?.trim() ?? "";
  if (!description) throw new Error("badRequest");
  const cost = roundCurrency(parseAmount(input.cost) || 0);
  if (!Number.isFinite(cost) || cost < 0) throw new Error("invalidAmount");
  const vendorId = input.vendorId?.trim() || project.vendorId;
  const row: Intervention = {
    id: crypto.randomUUID(),
    condominiumId: project.condominiumId,
    projectId: project.id,
    vendorId,
    date:
      input.date && isIsoDate(input.date) ? input.date.slice(0, 10) : todayKey(),
    description,
    cost,
    company: input.company?.trim() || vendorName,
    photos: Array.isArray(input.photos) ? input.photos : [],
  };
  const interventions = [normalizeIntervention(row), ...state.interventions];
  return putProject({ ...state, interventions }, { ...project, updatedAt: nowIso() });
}

export function removeIntervention(
  state: WorksState,
  interventionId: string,
): WorksState {
  const row = state.interventions.find((item) => item.id === interventionId);
  if (!row) throw new Error("interventionNotFound");
  const projectId = row.projectId;
  const interventions = removeById(state.interventions, interventionId);
  if (!projectId) return { ...state, interventions };
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return { ...state, interventions };
  if (project.status === "completed") throw new Error("alreadyComplete");
  return putProject({ ...state, interventions }, { ...project, updatedAt: nowIso() });
}

export function completeProject(state: WorksState, projectId: string): WorksState {
  const project = requireProject(state, projectId);
  const count = interventionCountFor(projectId, state.interventions);
  if (!canComplete(project, count)) {
    if (count === 0) throw new Error("workLogRequired");
    closedStatusError(project);
  }
  return {
    ...state,
    projects: upsertById(state.projects, {
      ...project,
      status: "completed",
      updatedAt: nowIso(),
    }),
  };
}

export function cancelProject(state: WorksState, projectId: string): WorksState {
  const project = requireProject(state, projectId);
  if (!isWorksOpen(project)) closedStatusError(project);
  return {
    ...state,
    projects: upsertById(state.projects, {
      ...project,
      status: "cancelled",
      updatedAt: nowIso(),
    }),
  };
}

export function syncProjectsFromAssembly(
  state: WorksState,
  assembly: Assembly,
): WorksState {
  let changed = false;
  const projects = state.projects.map((project) => {
    const next = applyAssemblyClose(project, assembly);
    if (next === project) return project;
    changed = true;
    return withDerivedStatus(
      next,
      interventionCountFor(project.id, state.interventions),
    );
  });
  return changed ? { ...state, projects } : state;
}
