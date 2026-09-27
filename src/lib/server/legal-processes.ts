import type { LegalProcess } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import type { CollectionsState } from "@/lib/collections/types";
import type { Portfolio } from "@/lib/portfolio/types";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import { getPortfolio } from "./portfolio";
import { getCollections } from "./collections";
import { readStore, writeStore, type StoreDocument } from "./store";

export type LegalProcessInput = {
  ownerId: string;
  condominiumId?: string;
  certificateId?: string | null;
  description?: string;
  documents?: string[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function unpaidOwnerId(
  portfolio: Portfolio,
  collections: CollectionsState | undefined,
): string | undefined {
  const quotas = collections?.quotas ?? [];
  const ranked = [
    ...quotas.filter((quota) => quota.status === "overdue"),
    ...quotas.filter((quota) => quota.status === "pending"),
  ];
  return ranked
    .map((quota) => quota.ownerId)
    .find((ownerId) => occupanciesForOwner(portfolio.units, ownerId).length > 0);
}

function demoLegalSubject(
  portfolio: Portfolio,
  collections: CollectionsState | undefined,
): {
  ownerId: string;
  condominiumId: string;
  certificateId: string | null;
} | null {
  const certificate = collections?.certificates[0];
  const ownerId =
    (certificate?.ownerId &&
    portfolio.owners.some((owner) => owner.id === certificate.ownerId)
      ? certificate.ownerId
      : undefined) ??
    unpaidOwnerId(portfolio, collections) ??
    portfolio.owners.find(
      (owner) => occupanciesForOwner(portfolio.units, owner.id).length > 0,
    )?.id;
  if (!ownerId) return null;
  const condominiumId =
    certificate?.condominiumId ||
    occupanciesForOwner(portfolio.units, ownerId)[0]?.unit.condominiumId ||
    portfolio.condominiums[0]?.id;
  if (!condominiumId) return null;
  return {
    ownerId,
    condominiumId,
    certificateId: certificate?.id ?? null,
  };
}

function buildFixtureLegalProcess(
  store: StoreDocument,
  workspaceEmail: string,
): LegalProcess | null {
  const key = normalizeEmail(workspaceEmail);
  const portfolio = store.portfolios[key];
  if (!portfolio) return null;
  const subject = demoLegalSubject(portfolio, store.collections[key]);
  if (!subject) return null;
  return {
    id: "lp-demo-1",
    condominiumId: subject.condominiumId,
    ownerId: subject.ownerId,
    certificateId: subject.certificateId,
    number: `LP-${new Date().getFullYear()}-0001`,
    description: "Debt enforcement — certidão de dívida emitida após escalada",
    status: "ongoing",
    documents: [],
    openedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    resolvedAt: null,
  };
}

function demoLegalProcessFromStore(
  store: StoreDocument,
  workspaceEmail: string,
): LegalProcess | null {
  const key = normalizeEmail(workspaceEmail);
  if (!isDemoEmail(key)) return null;
  return buildFixtureLegalProcess(store, key);
}

function loadProcesses(workspaceEmail: string): LegalProcess[] {
  const key = normalizeEmail(workspaceEmail);
  const stored = readStore().legalProcessesByHost[key] ?? [];
  if (stored.length > 0) return stored;
  const demo = demoLegalProcessFromStore(readStore(), key);
  return demo ? [demo] : [];
}

function saveProcesses(
  workspaceEmail: string,
  processes: LegalProcess[],
): LegalProcess[] {
  const key = normalizeEmail(workspaceEmail);
  const store = readStore();
  store.legalProcessesByHost[key] = processes;
  writeStore(store);
  return processes;
}

function nextProcessNumber(
  processes: LegalProcess[],
  year: number,
): string {
  const prefix = `LP-${year}-`;
  const maxSeq = processes.reduce((max, process) => {
    if (!process.number.startsWith(prefix)) return max;
    const seq = Number.parseInt(process.number.slice(prefix.length), 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

export function listLegalProcesses(workspaceEmail: string): LegalProcess[] {
  return loadProcesses(workspaceEmail);
}

export function openLegalProcess(
  workspaceEmail: string,
  input: LegalProcessInput,
): LegalProcess {
  if (!input.ownerId) {
    throw new Error("badRequest");
  }

  const portfolio = getPortfolio(workspaceEmail);
  const owner = portfolio.owners.find((item) => item.id === input.ownerId);
  if (!owner) {
    throw new Error("notFound");
  }

  const collections = getCollections(workspaceEmail);
  const condominiumId =
    input.condominiumId ||
    occupanciesForOwner(portfolio.units, owner.id)[0]?.unit.condominiumId ||
    portfolio.condominiums[0]?.id;

  if (!condominiumId) {
    throw new Error("condominiumNotFound");
  }

  const certificate = input.certificateId
    ? collections.certificates.find((item) => item.id === input.certificateId)
    : undefined;

  const processes = loadProcesses(workspaceEmail);
  const year = new Date().getFullYear();
  const number = nextProcessNumber(processes, year);
  const description =
    input.description?.trim() ||
    (certificate
      ? `Debt enforcement — certidão ${certificate.number}`
      : `Debt enforcement — ${owner.fullName}`);

  const process: LegalProcess = {
    id: crypto.randomUUID(),
    condominiumId,
    ownerId: owner.id,
    certificateId: certificate?.id ?? input.certificateId ?? null,
    number,
    description,
    status: "ongoing",
    documents: input.documents ?? [],
    openedAt: new Date().toISOString(),
    resolvedAt: null,
  };

  saveProcesses(workspaceEmail, [...processes, process]);
  return process;
}

export function updateLegalProcess(
  workspaceEmail: string,
  id: string,
  patch: Partial<
    Pick<LegalProcess, "description" | "status" | "documents" | "resolvedAt">
  >,
): LegalProcess {
  const processes = loadProcesses(workspaceEmail);
  const index = processes.findIndex((process) => process.id === id);
  if (index < 0) {
    throw new Error("notFound");
  }

  const current = processes[index];
  const nextStatus = patch.status ?? current.status;
  const resolvedAt =
    patch.resolvedAt !== undefined
      ? patch.resolvedAt
      : nextStatus === "resolved" && !current.resolvedAt
        ? new Date().toISOString()
        : current.resolvedAt;

  const updated: LegalProcess = {
    ...current,
    ...patch,
    status: nextStatus,
    resolvedAt,
  };

  const next = [...processes];
  next[index] = updated;
  saveProcesses(workspaceEmail, next);
  return updated;
}

export function demoLegalSeedNeeded(
  store: StoreDocument,
  workspaceEmail: string,
): boolean {
  const key = normalizeEmail(workspaceEmail);
  if ((store.legalProcessesByHost[key] ?? []).length > 0) return false;
  return demoLegalProcessFromStore(store, key) !== null;
}

/** Mutates `store` in place. Returns whether anything was written. */
export function seedDemoLegalProcesses(
  store: StoreDocument,
  workspaceEmail: string,
): boolean {
  const key = normalizeEmail(workspaceEmail);
  if ((store.legalProcessesByHost[key] ?? []).length > 0) return false;
  const process = buildFixtureLegalProcess(store, key);
  if (!process) return false;
  store.legalProcessesByHost[key] = [process];
  return true;
}
