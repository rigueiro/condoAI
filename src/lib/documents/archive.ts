import type { Assembly } from "@/lib/assemblies/types";
import type { WorksProject } from "@/lib/works/types";
import type {
  Certificate,
  Condominium,
  Expense,
  InsurancePolicy,
  MaintenanceContract,
} from "@/types";
import type { ManagerDocument, ManagerDocumentKind } from "./types";

function isoDate(value: string | Date | null | undefined): string | null {
  if (value == null || value === "") return null;
  return String(value).slice(0, 10);
}

function doc(
  partial: Omit<ManagerDocument, "subtitle"> & { subtitle?: string | null },
): ManagerDocument {
  return { subtitle: null, ...partial };
}

export type DocumentArchiveInput = {
  condominiums: Condominium[];
  policies: InsurancePolicy[];
  certificates: Certificate[];
  assemblies: Assembly[];
  expenses: Expense[];
  contracts: MaintenanceContract[];
  worksProjects?: WorksProject[];
  /** When set, only documents for this condominium are returned. */
  condominiumId?: string | null;
};

export function buildDocumentArchive(input: DocumentArchiveInput): ManagerDocument[] {
  const {
    condominiums,
    policies,
    certificates,
    assemblies,
    expenses,
    contracts,
    worksProjects = [],
    condominiumId,
  } = input;

  const matchesCondo = (id: string) =>
    !condominiumId || id === condominiumId;

  const documents: ManagerDocument[] = [];

  for (const condo of condominiums) {
    if (!matchesCondo(condo.id)) continue;

    documents.push(
      doc({
        id: `title-${condo.id}`,
        kind: "constitutive-title",
        condominiumId: condo.id,
        title: condo.propertyRegistryNumber || condo.name,
        date: isoDate(condo.deedDate),
        file: condo.constitutiveTitle,
        source: "property",
        sourceId: condo.id,
      }),
      doc({
        id: `regs-${condo.id}`,
        kind: "internal-regulations",
        condominiumId: condo.id,
        title: condo.internalRegulations.version
          ? `v${condo.internalRegulations.version}`
          : condo.name,
        date: isoDate(condo.internalRegulations.date),
        file: condo.internalRegulations.file,
        source: "property",
        sourceId: condo.id,
      }),
    );
  }

  for (const policy of policies) {
    if (!matchesCondo(policy.condominiumId)) continue;
    documents.push(
      doc({
        id: `ins-${policy.id}`,
        kind: "insurance",
        condominiumId: policy.condominiumId,
        title: policy.insurer,
        subtitle: policy.number,
        date: isoDate(policy.renewalDate),
        file: null,
        source: "compliance",
        sourceId: policy.id,
      }),
    );
  }

  for (const cert of certificates) {
    if (!matchesCondo(cert.condominiumId)) continue;
    documents.push(
      doc({
        id: `cert-${cert.id}`,
        kind: "certificate",
        condominiumId: cert.condominiumId,
        title: cert.type,
        date: isoDate(cert.validity),
        file: cert.file,
        source: "compliance",
        sourceId: cert.id,
      }),
    );
  }

  for (const assembly of assemblies) {
    if (!matchesCondo(assembly.condominiumId)) continue;
    const hasMinutes =
      Boolean(assembly.minutes?.file) || Boolean(assembly.minutes?.text?.trim());
    if (!hasMinutes) continue;
    documents.push(
      doc({
        id: `minutes-${assembly.id}`,
        kind: "assembly-minutes",
        condominiumId: assembly.condominiumId,
        title: assembly.title,
        subtitle: assembly.type,
        date: isoDate(assembly.scheduledDate),
        file: assembly.minutes?.file ?? null,
        textOnly: !assembly.minutes?.file && Boolean(assembly.minutes?.text?.trim()),
        source: "assemblies",
        sourceId: assembly.id,
      }),
    );
  }

  for (const expense of expenses) {
    if (!matchesCondo(expense.condominiumId)) continue;
    documents.push(
      doc({
        id: `inv-${expense.id}`,
        kind: "invoice",
        condominiumId: expense.condominiumId,
        title: expense.supplier,
        subtitle: expense.category,
        date: isoDate(expense.date),
        file: expense.invoice,
        source: "finance",
        sourceId: expense.id,
      }),
    );
  }

  for (const contract of contracts) {
    if (!matchesCondo(contract.condominiumId)) continue;
    documents.push(
      doc({
        id: `contract-${contract.id}`,
        kind: "maintenance-contract",
        condominiumId: contract.condominiumId,
        title: contract.service,
        subtitle: null,
        date: isoDate(contract.startDate),
        file: contract.document,
        source: "operations",
        sourceId: contract.id,
      }),
    );
  }

  for (const project of worksProjects) {
    if (!matchesCondo(project.condominiumId)) continue;
    for (const quote of project.quotes) {
      if (!quote.document) continue;
      documents.push(
        doc({
          id: `works-quote-${quote.id}`,
          kind: "works-quote",
          condominiumId: project.condominiumId,
          title: project.title,
          subtitle: project.number,
          date: isoDate(quote.receivedAt),
          file: quote.document,
          source: "works",
          sourceId: project.id,
        }),
      );
    }
  }

  documents.sort((a, b) => {
    const dateA = a.date ?? "";
    const dateB = b.date ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  return documents;
}

export function documentSourceHref(document: ManagerDocument): string {
  switch (document.source) {
    case "property":
      return `/properties-management/${document.condominiumId}`;
    case "compliance":
      return "/compliance";
    case "assemblies":
      return document.sourceId
        ? `/assemblies/${document.sourceId}`
        : "/assemblies";
    case "finance":
      return "/finance";
    case "operations":
      return "/operations";
    case "works":
      return document.sourceId ? `/works/${document.sourceId}` : "/works";
    default:
      return "/documents";
  }
}

export function isCorePropertyDocument(
  kind: ManagerDocumentKind,
): kind is "constitutive-title" | "internal-regulations" {
  return kind === "constitutive-title" || kind === "internal-regulations";
}
