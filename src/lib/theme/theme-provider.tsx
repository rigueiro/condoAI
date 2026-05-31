"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_THEME,
  isTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
  type ResolvedTheme,
  type Theme,
  type ThemeContextValue,
} from "./theme-context";

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (resolved: ResolvedTheme): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
};

// Local listeners so an in-app `setTheme` call notifies `useSyncExternalStore`
// subscribers (the native `storage` event only fires across tabs).
const themeListeners = new Set<() => void>();

const subscribeTheme = (onChange: () => void): (() => void) => {
  themeListeners.add(onChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onChange);
  }
  return () => {
    themeListeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange);
    }
  };
};

const subscribeSystemTheme = (onChange: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => DEFAULT_THEME,
  );
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => "light" as ResolvedTheme,
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Storage may be unavailable (private mode, etc.); ignore silently.
      }
    }
    themeListeners.forEach((listener) => listener());
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
