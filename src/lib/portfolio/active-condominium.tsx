"use client";

import { useMemo } from "react";
import { usePathname } from "@/i18n/navigation";
import { usePortfolio } from "./portfolio-provider";

export const BUILDING_WORKSPACE_TABS = [
  "overview",
  "units",
  "owners",
  "finance",
  "assemblies",
  "board",
  "occurrences",
  "works",
  "access",
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

function buildingIdFromWorkspacePath(pathname: string): string | null {
  if (
    !pathname.startsWith("/properties-management/") ||
    pathname === "/properties-management"
  ) {
    return null;
  }
  return pathname.slice("/properties-management/".length).split("/")[0] || null;
}

export function useActiveCondominium(): { activeId: string | null } {
  const pathname = usePathname();
  const { portfolio, isReady } = usePortfolio();
  const condominiums = portfolio.condominiums;
  const routeId = buildingIdFromWorkspacePath(pathname);

  const activeId = useMemo(() => {
    if (!routeId) return null;
    if (!isReady || condominiums.length === 0) return routeId;
    return condominiums.some((condo) => condo.id === routeId) ? routeId : null;
  }, [condominiums, isReady, routeId]);

  return { activeId };
}
