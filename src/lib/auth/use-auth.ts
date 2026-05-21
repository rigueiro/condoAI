"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";

/**
 * Access the full authentication context (user, loading state, login/logout).
 * Must be called from a component rendered under <AuthProvider/>.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Lightweight selector for components that only need the current user.
 */
export const useUser = () => useAuth().user;

/**
 * Lightweight selector for components that only need to know if a user
 * is currently signed in.
 */
export const useIsAuthenticated = () => useAuth().isAuthenticated;
