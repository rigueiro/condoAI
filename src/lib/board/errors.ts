import { BOARD_ERROR_CODES } from "./types";

export function boardErrorKey(code: string): string {
  return BOARD_ERROR_CODES.has(code) ? code : "requestFailed";
}
