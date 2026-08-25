export const LEGAL_NOTICE_DAYS = 10;
export const TOTAL_CAPITAL = 1000;
export const QUALIFIED_MAJORITY = 2 / 3;

export type AssemblyType = "ordinary" | "extraordinary";
export type AssemblyStatus = "draft" | "summoned" | "in_session" | "closed";
export type AssemblyCall = 1 | 2;
export type AttendanceStatus = "present" | "represented" | "absent";
export type VoteChoice = "for" | "against" | "abstain";
export type MajorityRule = "simple" | "absolute-present" | "qualified-total";
export type SummonsMethod = "email" | "mail";

export const VOTE_CHOICES: VoteChoice[] = ["for", "against", "abstain"];
export const MAJORITY_RULES: MajorityRule[] = [
  "simple",
  "absolute-present",
  "qualified-total",
];

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description: string;
  majority: MajorityRule;
}

export interface AttendanceRecord {
  ownerId: string;
  status: AttendanceStatus;
  representedByOwnerId: string | null;
}

export interface ItemVotes {
  itemId: string;
  ballots: Record<string, VoteChoice>;
}

export type SummonsDelivery = {
  emailed: number;
  skipped: number;
  lastAt: string | null;
};

export interface AssemblySummons {
  sentDate: string;
  method: SummonsMethod;
  title: string;
  content: string;
  proof: string | null;
  /** Client outbox fan-out summary after email delivery. */
  delivery: SummonsDelivery | null;
}

export interface AssemblyMinutesRecord {
  text: string;
  file: string | null;
  recordedAt: string | null;
}

export interface AssemblyResolution {
  id: string;
  itemId: string;
  title: string;
  text: string;
  forPermillage: number;
  againstPermillage: number;
  abstainPermillage: number;
  passed: boolean;
}

export interface Assembly {
  id: string;
  condominiumId: string;
  type: AssemblyType;
  status: AssemblyStatus;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  call: AssemblyCall;
  agenda: AgendaItem[];
  summons: AssemblySummons | null;
  attendance: AttendanceRecord[];
  votes: ItemVotes[];
  minutes: AssemblyMinutesRecord;
  resolutions: AssemblyResolution[];
}

export interface AssembliesState {
  assemblies: Assembly[];
}

export const EMPTY_ASSEMBLIES: AssembliesState = {
  assemblies: [],
};

export type CreateAssemblyInput = {
  condominiumId: string;
  type: AssemblyType;
  title: string;
  scheduledDate: string;
  scheduledTime?: string;
  location: string;
  agenda?: AgendaItem[];
};

export type SendSummonsInput = {
  id: string;
  method: SummonsMethod;
  title: string;
  content: string;
  sentDate?: string;
  proof?: string | null;
};

export type ResendSummonsInput = {
  id: string;
  title?: string;
  content?: string;
};

export type AttachProofInput = {
  id: string;
  proof: string | null;
};

export type RecordDeliveryInput = {
  id: string;
  emailed: number;
  skipped: number;
  lastAt?: string | null;
};

export type VotingShare = {
  ownerId: string;
  permillage: number;
  unitLabels: string[];
};

export type VoteTally = {
  itemId: string;
  forPermillage: number;
  againstPermillage: number;
  abstainPermillage: number;
  unvotedPermillage: number;
  passed: boolean;
};
