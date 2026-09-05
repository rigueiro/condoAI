import { WORKS_ERROR_CODES } from "./types";

export function worksErrorKey(code: string): string {
  return WORKS_ERROR_CODES.has(code) ? code : "requestFailed";
}
