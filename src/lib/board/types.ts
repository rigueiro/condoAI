export const BOARD_OFFICES = ["presidente", "secretario", "vogal"] as const;
export type BoardOffice = (typeof BOARD_OFFICES)[number];

export const MANDATE_STATUSES = [
  "upcoming",
  "active",
  "expired",
  "superseded",
] as const;
export type MandateStatus = (typeof MANDATE_STATUSES)[number];

/** Portuguese convocatória signature line (always PT on the legal notice). */
export const OFFICE_SUMMONS_LABEL: Record<BoardOffice | "administrador", string> =
  {
    presidente: "Presidente da administração",
    secretario: "Secretário da administração",
    vogal: "Vogal da administração",
    administrador: "O Administrador",
  };

export const DEFAULT_TERM_MONTHS = 12;
export const MAX_TERM_YEARS = 4;
export const EXPIRING_SOON_DAYS = 60;

export interface BoardSeat {
  id: string;
  ownerId: string;
  office: BoardOffice;
  /** This person may sign convocatórias. Presidente defaults to true. */
  canSignSummons: boolean;
}

export interface BoardMandate {
  id: string;
  number: string;
  condominiumId: string;
  startsOn: string;
  endsOn: string;
  assemblyId: string | null;
  agendaItemId: string | null;
  resolutionId: string | null;
  seats: BoardSeat[];
  notes: string;
  supersededBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  mandates: BoardMandate[];
  seqByYear: Record<string, number>;
}

export const EMPTY_BOARD: BoardState = {
  mandates: [],
  seqByYear: {},
};

export type SeatInput = {
  ownerId: string;
  office: BoardOffice;
  canSignSummons?: boolean;
};

export type RecordMandateInput = {
  condominiumId: string;
  startsOn: string;
  endsOn: string;
  seats: SeatInput[];
  assemblyId?: string | null;
  agendaItemId?: string | null;
  resolutionId?: string | null;
  notes?: string;
};

export type UpdateMandateInput = {
  id: string;
  startsOn?: string;
  endsOn?: string;
  seats?: SeatInput[];
  notes?: string;
};

export const BOARD_ERROR_CODES = new Set([
  "notFound",
  "mandateNotFound",
  "condominiumNotFound",
  "assemblyNotFound",
  "ownerRequired",
  "ownerNotEligible",
  "duplicateOwner",
  "presidenteRequired",
  "singlePresidente",
  "signerRequired",
  "invalidDate",
  "termTooLong",
  "termInverted",
  "mandateLocked",
  "requestFailed",
]);
