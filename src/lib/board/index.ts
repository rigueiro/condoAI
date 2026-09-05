export type {
  BoardMandate,
  BoardOffice,
  BoardSeat,
  BoardState,
  MandateStatus,
  RecordMandateInput,
  SeatInput,
  UpdateMandateInput,
} from "./types";
export {
  BOARD_OFFICES,
  DEFAULT_TERM_MONTHS,
  EMPTY_BOARD,
  EXPIRING_SOON_DAYS,
  MAX_TERM_YEARS,
} from "./types";
export {
  boardEligibleOwners,
  daysUntil,
  defaultSigner,
  defaultTermEnd,
  isMandateOpen,
  mandateStatus,
  needsMandateRecording,
  passedElectionResolution,
  presidenteSeat,
  sortedSeats,
  summonsSigners,
} from "./rules";
export { boardErrorKey } from "./errors";
export {
  buildMandateAttention,
  currentMandate,
  mandatesForCondominium,
  statusTone,
} from "./views";
export { BoardProvider, useBoard } from "./board-provider";
