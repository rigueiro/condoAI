export const MANAGER_DOCUMENT_KINDS = [
  "constitutive-title",
  "internal-regulations",
  "assembly-minutes",
  "insurance",
  "certificate",
  "invoice",
  "maintenance-contract",
  "works-quote",
] as const;

export type ManagerDocumentKind = (typeof MANAGER_DOCUMENT_KINDS)[number];

export type DocumentsTab = "all" | ManagerDocumentKind;

export const DOCUMENT_TAB_KEYS: DocumentsTab[] = [
  "all",
  ...MANAGER_DOCUMENT_KINDS,
];

export type DocumentSource =
  | "property"
  | "compliance"
  | "assemblies"
  | "finance"
  | "operations"
  | "works";

export type ManagerDocument = {
  id: string;
  kind: ManagerDocumentKind;
  condominiumId: string;
  title: string;
  subtitle: string | null;
  date: string | null;
  file: string | null;
  source: DocumentSource;
  sourceId: string | null;
  /** Minutes recorded as text without an uploaded file. */
  textOnly?: boolean;
};
