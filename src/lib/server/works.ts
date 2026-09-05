import { isDemoEmail } from "@/lib/auth/constants";
import { mockWorksState } from "@/fixtures/works";
import type { Assembly } from "@/lib/assemblies/types";
import { issueExtraordinaryQuotaRecord } from "./finance";
import { getAssemblies } from "./assemblies";
import { getOperations, putVendor } from "./operations";
import { getPortfolio } from "./portfolio";
import { mockVendors } from "@/fixtures/domain";
import { readStore, writeStore } from "./store";
import { sanitizeOccurrencePhotos } from "@/lib/occurrences/photos";
import {
  addIntervention,
  addQuote,
  attachExtraordinaryQuota,
  awardQuote,
  cancelProject,
  completeProject,
  createProject,
  linkAssembly,
  normalizeWorks,
  removeIntervention,
  removeProject,
  removeQuote,
  syncProjectsFromAssembly,
  unlinkAssembly,
  updateProject,
} from "@/lib/works/storage";
import { canIssueQuota, quoteAmountForIssue } from "@/lib/works/pipeline";
import {
  EMPTY_WORKS,
  type AddInterventionInput,
  type AddWorksQuoteInput,
  type CreateWorksProjectInput,
  type IssueWorksQuotaInput,
  type LinkAssemblyInput,
  type UpdateWorksProjectInput,
  type WorksState,
} from "@/lib/works/types";

function loadOrSeedWorks(email: string): {
  key: string;
  state: WorksState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().works?.[key];
  if (existing) {
    return { key, state: normalizeWorks(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: normalizeWorks(mockWorksState()), seeded: true };
  }
  return { key, state: { ...EMPTY_WORKS }, seeded: false };
}

function persistWorks(key: string, state: WorksState): void {
  const store = readStore();
  store.works = store.works ?? {};
  store.works[key] = state;
  writeStore(store);
}

function peekWorks(email: string): WorksState {
  return loadOrSeedWorks(email).state;
}

function ensureDemoWorksVendors(email: string): void {
  if (!isDemoEmail(email)) return;
  const key = email.trim().toLowerCase();
  const ops = readStore().operations[key];
  if (ops?.vendors?.some((vendor) => vendor.id === "vendor-4")) return;
  const vendor = mockVendors.find((row) => row.id === "vendor-4");
  if (!vendor) return;
  if (getOperations(email).vendors.some((row) => row.id === vendor.id)) return;
  putVendor(email, vendor);
}

export function getWorks(email: string): WorksState {
  const { key, state, seeded } = loadOrSeedWorks(email);
  if (seeded) persistWorks(key, state);
  ensureDemoWorksVendors(email);
  return state;
}

function mutateWorks(
  email: string,
  mutator: (current: WorksState) => WorksState,
): WorksState {
  const { key, state } = loadOrSeedWorks(email);
  const next = normalizeWorks(mutator(state));
  persistWorks(key, next);
  return next;
}

function requireCondo(email: string, condominiumId: string): void {
  const portfolio = getPortfolio(email);
  if (!portfolio.condominiums.some((row) => row.id === condominiumId)) {
    throw new Error("condominiumNotFound");
  }
}

function requireVendor(email: string, vendorId: string, condominiumId: string) {
  const vendor = getOperations(email).vendors.find((row) => row.id === vendorId);
  if (!vendor || vendor.condominiumId !== condominiumId) {
    throw new Error("vendorRequired");
  }
  return vendor;
}

function requireAssembly(email: string, assemblyId: string): Assembly {
  const assembly = getAssemblies(email).assemblies.find(
    (row) => row.id === assemblyId,
  );
  if (!assembly) throw new Error("assemblyNotFound");
  return assembly;
}

export function createWorksProject(
  email: string,
  input: CreateWorksProjectInput,
): WorksState {
  requireCondo(email, input.condominiumId);
  return mutateWorks(email, (current) => createProject(current, input));
}

export function updateWorksProject(
  email: string,
  input: UpdateWorksProjectInput,
): WorksState {
  return mutateWorks(email, (current) => updateProject(current, input));
}

export function deleteWorksProject(email: string, id: string): WorksState {
  return mutateWorks(email, (current) => removeProject(current, id));
}

export function addWorksQuote(
  email: string,
  input: AddWorksQuoteInput,
): WorksState {
  const project = peekWorks(email).projects.find((row) => row.id === input.projectId);
  if (!project) throw new Error("projectNotFound");
  requireVendor(email, input.vendorId, project.condominiumId);
  return mutateWorks(email, (current) => addQuote(current, input));
}

export function deleteWorksQuote(
  email: string,
  projectId: string,
  quoteId: string,
): WorksState {
  return mutateWorks(email, (current) => removeQuote(current, projectId, quoteId));
}

export function awardWorksQuote(
  email: string,
  projectId: string,
  quoteId: string,
): WorksState {
  return mutateWorks(email, (current) => awardQuote(current, projectId, quoteId));
}

export function linkWorksAssembly(
  email: string,
  input: LinkAssemblyInput,
): WorksState {
  const assembly = requireAssembly(email, input.assemblyId);
  return mutateWorks(email, (current) => linkAssembly(current, input, assembly));
}

export function unlinkWorksAssembly(email: string, projectId: string): WorksState {
  return mutateWorks(email, (current) => unlinkAssembly(current, projectId));
}

export function issueWorksExtraordinary(
  email: string,
  input: IssueWorksQuotaInput,
): WorksState {
  const project = peekWorks(email).projects.find((row) => row.id === input.projectId);
  if (!project) throw new Error("projectNotFound");
  if (!canIssueQuota(project)) {
    if (project.extraordinaryQuotaId) throw new Error("alreadyIssued");
    if (project.resolutionPassed === false) throw new Error("resolutionRejected");
    throw new Error("resolutionRequired");
  }
  const quoted = quoteAmountForIssue(project);
  const totalAmount = input.totalAmount ?? quoted;
  if (totalAmount == null) throw new Error("invalidAmount");
  const description =
    input.description?.trim() || project.title || project.number;
  const { extra } = issueExtraordinaryQuotaRecord(email, {
    condominiumId: project.condominiumId,
    description,
    totalAmount,
    date: input.date,
    dueDate: input.dueDate,
  });
  return mutateWorks(email, (current) =>
    attachExtraordinaryQuota(current, project.id, extra.id),
  );
}

export function addWorksIntervention(
  email: string,
  input: AddInterventionInput,
): WorksState {
  const project = peekWorks(email).projects.find((row) => row.id === input.projectId);
  if (!project) throw new Error("projectNotFound");
  const vendorId = input.vendorId?.trim() || project.vendorId;
  if (!vendorId) throw new Error("vendorRequiredForLog");
  const vendor = requireVendor(email, vendorId, project.condominiumId);
  const photos = sanitizeOccurrencePhotos(input.photos ?? []);
  return mutateWorks(email, (current) =>
    addIntervention(current, { ...input, vendorId, photos }, vendor.name),
  );
}

export function deleteWorksIntervention(
  email: string,
  interventionId: string,
): WorksState {
  return mutateWorks(email, (current) =>
    removeIntervention(current, interventionId),
  );
}

export function completeWorksProject(email: string, id: string): WorksState {
  return mutateWorks(email, (current) => completeProject(current, id));
}

export function cancelWorksProject(email: string, id: string): WorksState {
  return mutateWorks(email, (current) => cancelProject(current, id));
}

export function syncWorksFromAssembly(email: string, assembly: Assembly): void {
  const { key, state } = loadOrSeedWorks(email);
  const next = syncProjectsFromAssembly(state, assembly);
  if (next === state) return;
  persistWorks(key, next);
}
