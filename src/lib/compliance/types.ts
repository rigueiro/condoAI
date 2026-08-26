import type { Certificate, InsurancePolicy } from "@/types";

export interface ComplianceState {
  policies: InsurancePolicy[];
  certificates: Certificate[];
}

export const EMPTY_COMPLIANCE: ComplianceState = {
  policies: [],
  certificates: [],
};

export type ComplianceKind = "insurance" | "certificate";

/** Deadline row for the compliance daily job (renewals / validity). */
export type AttentionItem = {
  id: string;
  kind: "insurance" | "certificate";
  condominiumId: string;
  condominiumName: string;
  title: string;
  detail: string;
  dueDate: string;
  /** Negative = already past due. */
  daysUntil: number;
  urgency: "overdue" | "due-soon";
};

export type ComplianceTab = ComplianceKind | "attention" | "legal";
