import type { User } from "@/app/types";
import { UserRole } from "@/app/types";
import {
  DEMO_EMAIL,
  DEFAULT_PASSWORD,
  MIN_PASSWORD_LENGTH,
  isDemoEmail,
} from "@/lib/auth/constants";
import {
  accountToUser,
  readStore,
  updateStore,
  type StoreDocument,
  type StoredAccount,
} from "./store";
import {
  hashPassword,
  isPasswordHash,
  passwordMatches,
} from "./password";
import {
  ensurePartnerManagerAccount,
  ensurePortalDemoAccounts,
  PARTNER_MANAGER_EMAIL,
  PORTAL_DEMO_BOARD_EMAIL,
  PORTAL_DEMO_OWNER_EMAIL,
} from "./demo";

const RESET_TTL_MS = 60 * 60 * 1000;

const DEMO_USER: User = {
  id: "1",
  email: DEMO_EMAIL,
  name: "Rafael Rigueiro",
  role: "Property Manager",
  roleCode: UserRole.PropertyManager,
  avatar: null,
};

const PORTAL_DEMO_EMAILS = new Set([
  PORTAL_DEMO_BOARD_EMAIL,
  PORTAL_DEMO_OWNER_EMAIL,
]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function ensurePortalSeedIfNeeded(email: string): void {
  const key = normalizeEmail(email);
  if (PORTAL_DEMO_EMAILS.has(key)) {
    ensurePortalDemoAccounts();
  }
}

export function assertPasswordLength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("passwordTooShort");
  }
}

export function resolveUser(email: string): User {
  const key = normalizeEmail(email);
  if (isDemoEmail(key)) {
    return { ...DEMO_USER, email: key };
  }
  const account = readStore().accounts[key];
  if (!account) {
    throw new Error("invalidCredentials");
  }
  return accountToUser(account);
}

export function isKnownAccount(email: string): boolean {
  const key = normalizeEmail(email);
  ensurePortalSeedIfNeeded(key);
  if (isDemoEmail(key) || key === PARTNER_MANAGER_EMAIL) return true;
  return Boolean(readStore().accounts[key]);
}

function storedSecretFor(email: string): string | null {
  const key = normalizeEmail(email);
  const store = readStore();
  if (isDemoEmail(key)) {
    return store.demoPassword || DEFAULT_PASSWORD;
  }
  const accountPassword = store.accounts[key]?.password;
  if (accountPassword) return accountPassword;
  if (key === PARTNER_MANAGER_EMAIL) {
    return store.demoPassword || DEFAULT_PASSWORD;
  }
  return null;
}

export function verifyCredentials(email: string, password: string): boolean {
  const key = normalizeEmail(email);
  ensurePortalSeedIfNeeded(key);
  return passwordMatches(storedSecretFor(key), password);
}

function persistPasswordHash(email: string, hash: string): void {
  const key = normalizeEmail(email);
  updateStore((store) => {
    if (isDemoEmail(key)) {
      store.demoPassword = hash;
      return;
    }
    const account = store.accounts[key];
    if (!account) return;
    store.accounts[key] = { ...account, password: hash };
  });
}

export function loginUser(
  email: string,
  password: string,
): User {
  const key = normalizeEmail(email);
  ensurePortalSeedIfNeeded(key);
  const stored = storedSecretFor(key);
  if (!passwordMatches(stored, password)) {
    throw new Error("invalidCredentials");
  }
  if (stored && !isPasswordHash(stored)) {
    persistPasswordHash(key, hashPassword(password));
  }
  ensurePartnerManagerAccount(key);
  return resolveUser(email);
}

export function registerAccount(
  name: string,
  email: string,
  password: string,
): User {
  const key = normalizeEmail(email);
  if (isDemoEmail(key) || key === PARTNER_MANAGER_EMAIL) {
    throw new Error("emailAlreadyRegistered");
  }
  assertPasswordLength(password);
  const store = readStore();
  if (store.accounts[key]) {
    throw new Error("emailAlreadyRegistered");
  }
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    email: key,
    name: name.trim(),
    password: hashPassword(password),
    role: "Property Manager",
    roleCode: UserRole.PropertyManager,
    avatar: null,
    phone: null,
  };
  updateStore((s) => {
    s.accounts[key] = account;
  });
  return accountToUser(account);
}

function pruneResetTokens(
  store: Pick<StoreDocument, "resetTokens">,
  now: number,
  email?: string,
): void {
  for (const [id, record] of Object.entries(store.resetTokens)) {
    if (record.expiresAt <= now || (email != null && record.email === email)) {
      delete store.resetTokens[id];
    }
  }
}

function applyPasswordHash(
  store: StoreDocument,
  email: string,
  hash: string,
): void {
  if (isDemoEmail(email)) {
    store.demoPassword = hash;
    return;
  }
  const account = store.accounts[email];
  if (!account) {
    throw new Error("invalidResetToken");
  }
  store.accounts[email] = { ...account, password: hash };
}

export function createResetToken(email: string): { token: string; email: string } {
  const key = normalizeEmail(email);
  const token = crypto.randomUUID().replace(/-/g, "");
  const now = Date.now();
  updateStore((store) => {
    pruneResetTokens(store, now, key);
    store.resetTokens[token] = {
      email: key,
      expiresAt: now + RESET_TTL_MS,
    };
  });
  return { token, email: key };
}

export function peekResetToken(token: string): { email: string } {
  const record = readStore().resetTokens[token];
  if (!record) {
    throw new Error("invalidResetToken");
  }
  if (Date.now() > record.expiresAt) {
    throw new Error("expiredResetToken");
  }
  return { email: record.email };
}

function setAccountPassword(email: string, newPassword: string): void {
  const key = normalizeEmail(email);
  const hash = hashPassword(newPassword);
  updateStore((store) => {
    applyPasswordHash(store, key, hash);
  });
}

export function consumeResetToken(token: string, newPassword: string): void {
  const store = readStore();
  const record = store.resetTokens[token];
  if (!record) {
    throw new Error("invalidResetToken");
  }
  if (Date.now() > record.expiresAt) {
    throw new Error("expiredResetToken");
  }
  const email = record.email;
  if (!isDemoEmail(email) && !store.accounts[email]) {
    updateStore((next) => {
      pruneResetTokens(next, Date.now());
      delete next.resetTokens[token];
    });
    throw new Error("invalidResetToken");
  }
  assertPasswordLength(newPassword);
  const hash = hashPassword(newPassword);
  const now = Date.now();
  updateStore((next) => {
    pruneResetTokens(next, now);
    delete next.resetTokens[token];
    applyPasswordHash(next, email, hash);
  });
}

export function changePassword(
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

export function updateAccountProfile(
  email: string,
  updates: Partial<Pick<User, "name" | "role" | "avatar" | "phone">>,
): User {
  const key = normalizeEmail(email);
  if (isDemoEmail(key)) {
    return {
      ...DEMO_USER,
      ...updates,
      id: DEMO_USER.id,
      email: key,
    };
  }
  let next: StoredAccount | null = null;
  updateStore((store) => {
    const account = store.accounts[key];
    if (!account) {
      throw new Error("notAuthenticated");
    }
    next = {
      ...account,
      name: updates.name ?? account.name,
      role: updates.role ?? account.role,
      avatar: updates.avatar !== undefined ? updates.avatar : account.avatar,
      phone: updates.phone !== undefined ? updates.phone : account.phone,
    };
    store.accounts[key] = next;
  });
  if (!next) throw new Error("notAuthenticated");
  return accountToUser(next);
}
