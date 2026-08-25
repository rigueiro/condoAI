export const ASSEMBLY_ERROR_CODES = [
  "requestFailed",
  "badRequest",
  "assemblyClosed",
  "assemblyLocked",
  "agendaRequired",
  "summonsRequired",
  "noticeTooShort",
  "proofRequired",
  "notInSession",
  "quorumRequired",
  "minutesRequired",
  "notFound",
] as const;

export type AssemblyErrorCode = (typeof ASSEMBLY_ERROR_CODES)[number];

export function isAssemblyErrorCode(code: string): code is AssemblyErrorCode {
  return (ASSEMBLY_ERROR_CODES as readonly string[]).includes(code);
}

export function assemblyErrorKey(code: string): AssemblyErrorCode {
  return isAssemblyErrorCode(code) ? code : "requestFailed";
}
