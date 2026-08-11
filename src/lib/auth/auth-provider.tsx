"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/app/types";
import { apiFetch } from "@/lib/api/client";
import {
  AuthContext,
  type AuthContextValue,
  type PasswordResetRequestResult,
} from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ user: User }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
        const data = await apiFetch<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            rememberMe: options?.rememberMe ?? false,
          }),
        });
        setUser(data.user);
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

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      options?: { rememberMe?: boolean },
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ user: User }>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            rememberMe: options?.rememberMe ?? true,
          }),
        });
        setUser(data.user);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "signupFailed";
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
      await apiFetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "logoutFailed");
      throw err;
    }
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>): Promise<User> => {
      const data = await apiFetch<{ user: User }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<PasswordResetRequestResult> => {
      setError(null);
      return apiFetch<PasswordResetRequestResult>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
    },
    [],
  );

  const validateResetToken = useCallback(
    async (token: string): Promise<{ email: string }> => {
      return apiFetch<{ email: string }>(
        `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
      );
    },
    [],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<void> => {
      setError(null);
      try {
        await apiFetch("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token, newPassword }),
        });
        setUser(null);
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
        await apiFetch("/api/auth/password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
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
      signup,
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
      signup,
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
