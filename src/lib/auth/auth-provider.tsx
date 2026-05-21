"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/app/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

const STORAGE_KEY = "condoai.user";
const SESSION_STORAGE_KEY = "condoai.user.session";

const DEMO_USER: User = {
  id: "1",
  email: "admin@condoai.pt",
  name: "Rafael Rigueiro",
  role: "Property Manager",
  avatar: null,
};

const simulateLogin = (email: string, password: string): Promise<User> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@condoai.pt" && password === "admin123") {
        resolve({ ...DEMO_USER, email });
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login,
      logout,
    }),
    [user, isLoading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
