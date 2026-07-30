/**
 * Client-side credential + reset-token store for the demo auth layer.
 * Replaces hardcoded login passwords so forgot/reset password can work
 * end-to-end without a backend. Swap for a real API when one exists.
 *
 * TODO: Passwords are stored in plaintext localStorage for the demo only.
 * Never copy this pattern into a real backend — hash server-side and use
 * httpOnly session cookies / a proper identity provider.
 */

export const DEMO_EMAIL = "admin@condoai.pt";
export const DEFAULT_PASSWORD = "admin123";
/** Shared minimum length for login, reset, and profile password changes. */
export const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_KEY = "condoai.auth.password";
const RESET_TOKEN_KEY = "condoai.auth.reset";

/** Reset links expire after one hour. */
const RESET_TTL_MS = 60 * 60 * 1000;

export interface ResetTokenRecord {
  email: string;
  token: string;
  expiresAt: number;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isBrowser = (): boolean => typeof window !== "undefined";

export const isKnownAccount = (email: string): boolean =>
  normalizeEmail(email) === DEMO_EMAIL;

export function getStoredPassword(): string {
  if (!isBrowser()) return DEFAULT_PASSWORD;
  return window.localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
}

export function setStoredPassword(password: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PASSWORD_KEY, password);
}

export function verifyCredentials(email: string, password: string): boolean {
  return isKnownAccount(email) && password === getStoredPassword();
}

export function createResetToken(email: string): ResetTokenRecord {
  const record: ResetTokenRecord = {
    email: normalizeEmail(email),
    token: crypto.randomUUID().replace(/-/g, ""),
    expiresAt: Date.now() + RESET_TTL_MS,
  };
  if (isBrowser()) {
    window.localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify(record));
  }
  return record;
}

export function readResetToken(): ResetTokenRecord | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(RESET_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResetTokenRecord;
  } catch {
    window.localStorage.removeItem(RESET_TOKEN_KEY);
    return null;
  }
}

export function clearResetToken(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(RESET_TOKEN_KEY);
}

/**
 * Validates a reset token without consuming it (for page load checks).
 * Returns the email when valid; throws error codes matching auth messages.
 */
export function peekResetToken(token: string): { email: string } {
  const record = readResetToken();
  if (!record || record.token !== token) {
    throw new Error("invalidResetToken");
  }
  if (Date.now() > record.expiresAt) {
    clearResetToken();
    throw new Error("expiredResetToken");
  }
  return { email: record.email };
}

/**
 * Ensures a password meets the shared minimum length used across auth flows.
 */
export function assertPasswordLength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("passwordTooShort");
  }
}

/**
 * Validates and consumes a reset token, then persists the new password.
 */
export function consumeResetToken(token: string, newPassword: string): void {
  const { email } = peekResetToken(token);
  if (!isKnownAccount(email)) {
    clearResetToken();
    throw new Error("invalidResetToken");
  }
  assertPasswordLength(newPassword);
  setStoredPassword(newPassword);
  clearResetToken();
}

export function changeStoredPassword(
  currentPassword: string,
  newPassword: string,
): void {
  if (currentPassword !== getStoredPassword()) {
    throw new Error("incorrectCurrentPassword");
  }
  if (currentPassword === newPassword) {
    throw new Error("sameAsCurrentPassword");
  }
  assertPasswordLength(newPassword);
  setStoredPassword(newPassword);
}
