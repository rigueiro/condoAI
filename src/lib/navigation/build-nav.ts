import { canManager } from "@/lib/team/permissions";
import type { TeamRole } from "@/lib/team/types";
import {
  MANAGER_NAV,
  NAV_EXACT_ROOTS,
  PORTAL_NAV,
  type CommandPaletteItem,
  type NavEntry,
  type NavEntryDef,
  type NavLink,
  type NavLinkDef,
} from "./config";

type TranslateNav = (key: string) => string;

function canSeeLink(role: TeamRole, link: NavLinkDef): boolean {
  return !link.permission || canManager(role, link.permission);
}

function resolveLink(t: TranslateNav, link: NavLinkDef): NavLink {
  return {
    label: t(link.labelKey),
    path: link.path,
    icon: link.icon,
  };
}

function buildEntries(
  defs: NavEntryDef[],
  t: TranslateNav,
  role?: TeamRole,
): NavEntry[] {
  const result: NavEntry[] = [];

  for (const entry of defs) {
    if (entry.type === "link") {
      if (role && !canSeeLink(role, entry.link)) continue;
      result.push({ type: "link", link: resolveLink(t, entry.link) });
      continue;
    }

    const items = entry.group.items
      .filter((item) => !role || canSeeLink(role, item))
      .map((item) => resolveLink(t, item));

    if (items.length === 0) continue;

    result.push({
      type: "group",
      group: {
        id: entry.group.id,
        label: t(entry.group.labelKey),
        icon: entry.group.icon,
        items,
      },
    });
  }

  return result;
}

export function buildNavigation(
  t: TranslateNav,
  options: { portal: true } | { portal: false; role: TeamRole },
): NavEntry[] {
  if (options.portal) return buildEntries(PORTAL_NAV, t);
  return buildEntries(MANAGER_NAV, t, options.role);
}

export function flattenForCommandPalette(
  entries: NavEntry[],
): CommandPaletteItem[] {
  const items: CommandPaletteItem[] = [];

  for (const entry of entries) {
    if (entry.type === "link") {
      items.push({ ...entry.link, keywords: entry.link.label });
      continue;
    }

    for (const item of entry.group.items) {
      items.push({
        ...item,
        groupLabel: entry.group.label,
        keywords: `${entry.group.label} ${item.label}`,
      });
    }
  }

  return items;
}

export function isNavigationPathActive(pathname: string, path: string): boolean {
  if (pathname === path) return true;
  if ((NAV_EXACT_ROOTS as readonly string[]).includes(path)) return false;
  return pathname.startsWith(`${path}/`);
}

export function isGroupActive(pathname: string, items: NavLink[]): boolean {
  return items.some((item) => isNavigationPathActive(pathname, item.path));
}
