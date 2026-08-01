/**
 * Client-side credential + reset-token store for the demo auth layer.
 * Supports the seeded demo account plus accounts registered via signup.
 * Swap for a real API when one exists.
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
const ACCOUNTS_KEY = "condoai.auth.accounts";
const RESET_TOKEN_KEY = "condoai.auth.reset";

/** Reset links expire after one hour. */
const RESET_TTL_MS = 60 * 60 * 1000;

export interface ResetTokenRecord {
  email: string;
  token: string;
  expiresAt: number;
}

export interface RegisteredAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isBrowser = (): boolean => typeof window !== "undefined";

export const isDemoEmail = (email: string): boolean =>
  normalizeEmail(email) === DEMO_EMAIL;

function readAccounts(): Record<string, RegisteredAccount> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, RegisteredAccount>;
  } catch {
    window.localStorage.removeItem(ACCOUNTS_KEY);
    return {};
  }
}

function writeAccounts(accounts: Record<string, RegisteredAccount>): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getRegisteredAccount(
  email: string,
): RegisteredAccount | null {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) return null;
  return readAccounts()[key] ?? null;
}

export const isKnownAccount = (email: string): boolean => {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) return true;
  return getRegisteredAccount(key) !== null;
};

export function getStoredPassword(): string {
  if (!isBrowser()) return DEFAULT_PASSWORD;
  return window.localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
}

export function setStoredPassword(password: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PASSWORD_KEY, password);
}

export function verifyCredentials(email: string, password: string): boolean {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) {
    return password === getStoredPassword();
  }
  const account = getRegisteredAccount(key);
  return account !== null && account.password === password;
}

/**
 * Registers a new account. Throws error codes matching auth messages.
 */
export function registerAccount(
  name: string,
  email: string,
  password: string,
): RegisteredAccount {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) {
    throw new Error("emailAlreadyRegistered");
  }
  if (getRegisteredAccount(key)) {
    throw new Error("emailAlreadyRegistered");
  }
  assertPasswordLength(password);
  const account: RegisteredAccount = {
    id: crypto.randomUUID(),
    email: key,
    name: name.trim(),
    password,
    role: "Property Manager",
  };
  const accounts = readAccounts();
  accounts[key] = account;
  writeAccounts(accounts);
  return account;
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

function setAccountPassword(email: string, newPassword: string): void {
  const key = normalizeEmail(email);
  if (key === DEMO_EMAIL) {
    setStoredPassword(newPassword);
    return;
  }
  const accounts = readAccounts();
  const account = accounts[key];
  if (!account) {
    throw new Error("invalidResetToken");
  }
  accounts[key] = { ...account, password: newPassword };
  writeAccounts(accounts);
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
  setAccountPassword(email, newPassword);
  clearResetToken();
}

export function changeStoredPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): void {
  if (!verifyCredentials(email, currentPassword)) {
    throw new Error("incorrectCurrentPassword");
  }
  if (currentPassword === newPassword) {
    throw new Error("sameAsCurrentPassword");
  }
  assertPasswordLength(newPassword);
  setAccountPassword(email, newPassword);
}
