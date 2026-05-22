"use client";

import { createContext } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** The user's stored preference (may be "system"). */
  theme: Theme;
  /** The concrete value currently applied to the document. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

ThemeContext.displayName = "ThemeContext";

export const THEME_STORAGE_KEY = "condoai.theme";
export const DEFAULT_THEME: Theme = "system";

export const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system";
