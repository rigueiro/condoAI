import type { LegalProcess } from "@/types";
import { isDemoEmail } from "@/lib/auth/constants";
import { getPortfolio } from "./portfolio";
import { getCollections } from "./collections";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import { readStore, writeStore } from "./store";

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

function readProcesses(workspaceEmail: string): LegalProcess[] {
  const key = normalizeEmail(workspaceEmail);
  return readStore().legalProcessesByHost[key] ?? [];
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
  return readProcesses(workspaceEmail);
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

  const processes = readProcesses(workspaceEmail);
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
  const processes = readProcesses(workspaceEmail);
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

export function seedDemoLegalProcesses(workspaceEmail: string): void {
  if (!isDemoEmail(workspaceEmail)) return;
  if (readProcesses(workspaceEmail).length > 0) return;

  const portfolio = getPortfolio(workspaceEmail);
  const collections = getCollections(workspaceEmail);
  const owner = portfolio.owners.find((item) => item.id === "3");
  const certificate = collections.certificates[0];
  if (!owner) return;

  saveProcesses(workspaceEmail, [
    {
      id: "lp-demo-1",
      condominiumId: "1",
      ownerId: owner.id,
      certificateId: certificate?.id ?? null,
      number: `LP-${new Date().getFullYear()}-0001`,
      description: "Debt enforcement — certidão de dívida emitida após escalada",
      status: "ongoing",
      documents: [],
      openedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      resolvedAt: null,
    },
  ]);
}
