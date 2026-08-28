import type { ManagerAction } from "@/lib/team/permissions";

export const NAV_EXACT_ROOTS = ["/portal", "/dashboard"] as const;

export const NAV_LINK_ACTIVE =
  "border border-primary-100 bg-primary-50 text-primary";
export const NAV_LINK_INACTIVE =
  "text-text-secondary hover:bg-secondary-50 hover:text-text-primary";

export function navLinkClass(active: boolean, extra = ""): string {
  return `${active ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE} ${extra}`.trim();
}

export type NavLinkDef = {
  labelKey: string;
  path: string;
  icon: string;
  permission?: ManagerAction;
};

export type NavGroupDef = {
  id: string;
  labelKey: string;
  icon: string;
  items: NavLinkDef[];
};

export type NavEntryDef =
  | { type: "link"; link: NavLinkDef }
  | { type: "group"; group: NavGroupDef };

export type NavLink = {
  label: string;
  path: string;
  icon: string;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: string;
  items: NavLink[];
};

export type NavEntry =
  | { type: "link"; link: NavLink }
  | { type: "group"; group: NavGroup };

export type CommandPaletteItem = NavLink & {
  groupLabel?: string;
  keywords?: string;
};

function item(
  labelKey: string,
  path: string,
  icon: string,
  permission?: ManagerAction,
): NavLinkDef {
  return { labelKey, path, icon, permission };
}

function link(
  labelKey: string,
  path: string,
  icon: string,
  permission?: ManagerAction,
): NavEntryDef {
  return { type: "link", link: item(labelKey, path, icon, permission) };
}

function group(
  id: string,
  labelKey: string,
  icon: string,
  items: NavLinkDef[],
): NavEntryDef {
  return { type: "group", group: { id, labelKey, icon, items } };
}

export const MANAGER_NAV: NavEntryDef[] = [
  link("dashboard", "/dashboard", "LayoutDashboard"),
  group("portfolio", "groups.portfolio", "Briefcase", [
    item("properties", "/properties-management", "Building2", "readPortfolio"),
    item("owners", "/owners-management", "Users", "readPortfolio"),
  ]),
  group("finance", "groups.finance", "Wallet", [
    item("payments", "/payment-tracking", "CreditCard", "readCollections"),
    item("budgetsAndAccounts", "/finance", "Landmark", "readFinance"),
  ]),
  group("operations", "groups.operations", "Wrench", [
    item("occurrences", "/occurrences", "ClipboardList", "readOccurrences"),
    item(
      "vendorsAndEquipment",
      "/operations",
      "Hammer",
      "readOperations",
    ),
    item("announcements", "/announcements", "Mail", "readAnnouncements"),
  ]),
  group("governance", "groups.governance", "ScrollText", [
    item("assemblies", "/assemblies", "Gavel", "readAssemblies"),
    item("compliance", "/compliance", "ShieldCheck", "readCompliance"),
    item("documentsArchive", "/documents", "FolderOpen", "readCompliance"),
  ]),
  link("reports", "/reports-analytics", "BarChart3", "readCollections"),
];

const PORTAL_LINKS: NavLinkDef[] = [
  item("portal", "/portal", "Home"),
  item("extract", "/portal/extract", "Receipt"),
  item("documents", "/portal/documents", "FolderOpen"),
  item("occurrences", "/portal/occurrences", "ClipboardList"),
  item("announcements", "/portal/announcements", "Mail"),
  item("budget", "/portal/budget", "Wallet"),
];

export const PORTAL_NAV: NavEntryDef[] = PORTAL_LINKS.map((entry) => ({
  type: "link",
  link: entry,
}));
