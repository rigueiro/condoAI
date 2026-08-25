"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/auth";
import { usePortfolio } from "./portfolio-provider";

const STORAGE_PREFIX = "condoai.activeCondominium.";

export const BUILDING_WORKSPACE_TABS = [
  "overview",
  "units",
  "owners",
  "finance",
  "occurrences",
] as const;

export type BuildingWorkspaceTab = (typeof BUILDING_WORKSPACE_TABS)[number];

const TAB_SET = new Set<string>(BUILDING_WORKSPACE_TABS);

export function isBuildingWorkspaceTab(
  value: string | null | undefined,
): value is BuildingWorkspaceTab {
  return Boolean(value && TAB_SET.has(value));
}

export function buildingWorkspaceHref(
  condominiumId: string,
  tab?: string | null,
): string {
  if (tab && isBuildingWorkspaceTab(tab) && tab !== "overview") {
    return `/properties-management/${condominiumId}?tab=${tab}`;
  }
  return `/properties-management/${condominiumId}`;
}

export function isBuildingWorkspacePath(pathname: string): boolean {
  return (
    pathname.startsWith("/properties-management/") &&
    pathname !== "/properties-management"
  );
}

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function readStoredId(email: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(email));
  } catch {
    return null;
  }
}

function writeStoredId(email: string, id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(email);
    if (id) window.localStorage.setItem(key, id);
    else window.localStorage.removeItem(key);
    snapshotEmail = email;
    snapshotId = id;
  } catch {
    /* ignore quota / private mode */
  }
}

const listeners = new Set<() => void>();
let snapshotEmail: string | null = null;
let snapshotId: string | null = null;

function readSnapshot(email: string | null): string | null {
  if (email === snapshotEmail) return snapshotId;
  snapshotEmail = email;
  snapshotId = email ? readStoredId(email) : null;
  return snapshotId;
}

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = () => {
    snapshotEmail = null;
    onStoreChange();
  };
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function emitActiveCondominiumChange(): void {
  listeners.forEach((listener) => listener());
}

interface ActiveCondominiumContextValue {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  preferredId: string;
}

const ActiveCondominiumContext = createContext<
  ActiveCondominiumContextValue | undefined
>(undefined);

export function ActiveCondominiumProvider({
  children,
}: {
  children: ReactNode;
}) {
  const user = useUser();
  const email = user?.email ?? null;
  const { portfolio, isReady } = usePortfolio();
  const condominiums = portfolio.condominiums;

  const storedId = useSyncExternalStore(
    subscribe,
    () => readSnapshot(email),
    () => null,
  );

  const activeId = useMemo(() => {
    if (!email || !storedId) return null;
    if (!isReady || condominiums.length === 0) return storedId;
    return condominiums.some((condo) => condo.id === storedId)
      ? storedId
      : null;
  }, [condominiums, email, isReady, storedId]);

  const setActiveId = useCallback(
    (id: string | null) => {
      if (!email) return;
      if (!id) {
        if (readSnapshot(email) === null) return;
        writeStoredId(email, null);
        emitActiveCondominiumChange();
        return;
      }
      const next =
        !isReady ||
        condominiums.length === 0 ||
        condominiums.some((condo) => condo.id === id)
          ? id
          : null;
      if (readSnapshot(email) === next) return;
      writeStoredId(email, next);
      emitActiveCondominiumChange();
    },
    [condominiums, email, isReady],
  );

  const preferredId = activeId ?? condominiums[0]?.id ?? "";

  const value = useMemo<ActiveCondominiumContextValue>(
    () => ({
      activeId,
      setActiveId,
      preferredId,
    }),
    [activeId, setActiveId, preferredId],
  );

  return (
    <ActiveCondominiumContext.Provider value={value}>
      {children}
    </ActiveCondominiumContext.Provider>
  );
}

export function useActiveCondominium(): ActiveCondominiumContextValue {
  const ctx = useContext(ActiveCondominiumContext);
  if (!ctx) {
    throw new Error(
      "useActiveCondominium must be used within ActiveCondominiumProvider",
    );
  }
  return ctx;
}
