/**
 * Shared client-side auth form helpers (demo layer).
 */

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function resolveAuthErrorMessage(
  messageKey: string,
  translate: (key: string, values?: Record<string, string | number>) => string,
  fallbackKey: string,
  knownKeys: readonly string[],
  values?: Record<string, string | number>,
): string {
  if (knownKeys.includes(messageKey)) {
    return translate(messageKey, values);
  }
  return translate(fallbackKey, values);
}
