"use client";

import { createContext } from "react";
import type { User } from "@/app/types";

export interface PasswordResetRequestResult {
  /** Present only for known accounts in the demo (stand-in for the emailed link). */
  demoResetToken?: string;
}

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
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  validateResetToken: (token: string) => Promise<{ email: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

AuthContext.displayName = "AuthContext";
