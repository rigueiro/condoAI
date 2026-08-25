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
  type StoredAccount,
} from "./store";
import {
  ensurePortalDemoAccounts,
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
  ensurePortalSeedIfNeeded(key);
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
  if (isDemoEmail(key)) return true;
  return Boolean(readStore().accounts[key]);
}

export function verifyCredentials(email: string, password: string): boolean {
  const key = normalizeEmail(email);
  ensurePortalSeedIfNeeded(key);
  const store = readStore();
  if (isDemoEmail(key)) {
    return password === (store.demoPassword || DEFAULT_PASSWORD);
  }
  const account = store.accounts[key];
  return account != null && account.password === password;
}

export function loginUser(
  email: string,
  password: string,
): User {
  if (!verifyCredentials(email, password)) {
    throw new Error("invalidCredentials");
  }
  return resolveUser(email);
}

export function registerAccount(
  name: string,
  email: string,
  password: string,
): User {
  const key = normalizeEmail(email);
  if (isDemoEmail(key)) {
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
    password,
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

export function createResetToken(email: string): { token: string; email: string } {
  const key = normalizeEmail(email);
  const token = crypto.randomUUID().replace(/-/g, "");
  updateStore((store) => {
    store.resetTokens[token] = {
      email: key,
      expiresAt: Date.now() + RESET_TTL_MS,
    };
  });
  return { token, email: key };
}

export function peekResetToken(token: string): { email: string } {
  const store = readStore();
  const record = store.resetTokens[token];
  if (!record) {
    throw new Error("invalidResetToken");
  }
  if (Date.now() > record.expiresAt) {
    updateStore((s) => {
      delete s.resetTokens[token];
    });
    throw new Error("expiredResetToken");
  }
  return { email: record.email };
}

function setAccountPassword(email: string, newPassword: string): void {
  const key = normalizeEmail(email);
  updateStore((store) => {
    if (isDemoEmail(key)) {
      store.demoPassword = newPassword;
      return;
    }
    const account = store.accounts[key];
    if (!account) {
      throw new Error("invalidResetToken");
    }
    store.accounts[key] = { ...account, password: newPassword };
  });
}

export function consumeResetToken(token: string, newPassword: string): void {
  const { email } = peekResetToken(token);
  if (!isKnownAccount(email)) {
    updateStore((s) => {
      delete s.resetTokens[token];
    });
    throw new Error("invalidResetToken");
  }
  assertPasswordLength(newPassword);
  setAccountPassword(email, newPassword);
  updateStore((s) => {
    delete s.resetTokens[token];
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
