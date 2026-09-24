"use client";

import { createContext } from "react";
import type { User } from "@/app/types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<{ email: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  enterPlayground: () => Promise<void>;
  resetPlayground: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

AuthContext.displayName = "AuthContext";
