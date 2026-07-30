"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/app/types";
import {
  AuthContext,
  type AuthContextValue,
  type PasswordResetRequestResult,
} from "./auth-context";
import {
  changeStoredPassword,
  consumeResetToken,
  createResetToken,
  DEMO_EMAIL,
  isKnownAccount,
  peekResetToken,
  verifyCredentials,
} from "./credentials";

const STORAGE_KEY = "condoai.user";
const SESSION_STORAGE_KEY = "condoai.user.session";

const DEMO_USER: User = {
  id: "1",
  email: DEMO_EMAIL,
  name: "Rafael Rigueiro",
  role: "Property Manager",
  avatar: null,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const simulateLogin = (email: string, password: string): Promise<User> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (verifyCredentials(email, password)) {
        resolve({ ...DEMO_USER, email: email.trim().toLowerCase() });
      } else {
        reject(new Error("invalidCredentials"));
      }
    }, 500);
  });

const simulateLogout = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 200));

/**
 * Safely read the persisted user from browser storage.
 * Prefers localStorage (remember me) and falls back to sessionStorage.
 */
const readStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const writeStoredUser = (user: User, rememberMe: boolean): void => {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(user);
  if (rememberMe) {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Persist updates to the currently signed-in user, preserving the
 * storage tier (remember-me vs session-only) that was used at sign-in.
 */
const persistUpdatedUser = (user: User): void => {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(user);
  if (window.localStorage.getItem(STORAGE_KEY)) {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } else {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  }
};

const clearStoredUser = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { rememberMe?: boolean },
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const userData = await simulateLogin(email, password);
        setUser(userData);
        writeStoredUser(userData, options?.rememberMe ?? false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "loginFailed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await simulateLogout();
      setUser(null);
      clearStoredUser();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "logoutFailed");
      throw err;
    }
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>): Promise<User> => {
      const current = readStoredUser();
      if (!current) {
        throw new Error("notAuthenticated");
      }
      await delay(300);
      const next: User = { ...current, ...updates, id: current.id };
      setUser(next);
      persistUpdatedUser(next);
      return next;
    },
    [],
  );

  /**
   * Always resolves for valid email format callers — never reveals whether
   * the account exists. Demo accounts also get a one-time token so the
   * reset can continue without a real mailer.
   */
  const requestPasswordReset = useCallback(
    async (email: string): Promise<PasswordResetRequestResult> => {
      setError(null);
      await delay(700);
      if (!isKnownAccount(email)) {
        return {};
      }
      const record = createResetToken(email);
      return { demoResetToken: record.token };
    },
    [],
  );

  const validateResetToken = useCallback(
    async (token: string): Promise<{ email: string }> => {
      await delay(200);
      return peekResetToken(token);
    },
    [],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<void> => {
      setError(null);
      try {
        await delay(500);
        consumeResetToken(token, newPassword);
        // Force re-login with the new password.
        setUser(null);
        clearStoredUser();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "passwordResetFailed";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      setError(null);
      try {
        await delay(500);
        changeStoredPassword(currentPassword, newPassword);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "passwordChangeFailed";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login,
      logout,
      updateUser,
      requestPasswordReset,
      validateResetToken,
      resetPassword,
      changePassword,
    }),
    [
      user,
      isLoading,
      error,
      login,
      logout,
      updateUser,
      requestPasswordReset,
      validateResetToken,
      resetPassword,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
