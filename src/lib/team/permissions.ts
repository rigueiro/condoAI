import type { TeamRole } from "./types";

export type ManagerAction =
  | "readPortfolio"
  | "writePortfolio"
  | "writeOrganization"
  | "readCollections"
  | "writeCollections"
  | "recordPayment"
  | "issueDebtCertificate"
  | "readFinance"
  | "writeFinance"
  | "readCompliance"
  | "writeCompliance"
  | "readOccurrences"
  | "writeOccurrences"
  | "readAssemblies"
  | "writeAssemblies"
  | "readOperations"
  | "writeOperations"
  | "readAnnouncements"
  | "writeAnnouncements"
  | "readLegal"
  | "manageLegal"
  | "readTeam"
  | "manageTeam"
  | "managePortalAccess"
  | "transferOwnership";

const ALL_READ: ManagerAction[] = [
  "readPortfolio",
  "readCollections",
  "readFinance",
  "readCompliance",
  "readOccurrences",
  "readAssemblies",
  "readOperations",
  "readAnnouncements",
  "readLegal",
  "readTeam",
];

const MANAGER_WRITE: ManagerAction[] = [
  "writePortfolio",
  "writeCollections",
  "recordPayment",
  "issueDebtCertificate",
  "writeOccurrences",
  "writeAssemblies",
  "writeOperations",
  "writeAnnouncements",
  "manageLegal",
  "transferOwnership",
];

const STAFF_WRITE: ManagerAction[] = [
  "writeOccurrences",
  "writeOperations",
  "writeAnnouncements",
];

const ADMIN_WRITE: ManagerAction[] = [
  "writeOrganization",
  "writeFinance",
  "writeCompliance",
  "manageTeam",
  "managePortalAccess",
];

function grants(
  read: ManagerAction[],
  write: ManagerAction[] = [],
): ReadonlySet<ManagerAction> {
  return new Set([...read, ...write]);
}

const ROLE_ACTIONS: Record<TeamRole, ReadonlySet<ManagerAction>> = {
  owner: grants(ALL_READ, [...MANAGER_WRITE, ...STAFF_WRITE, ...ADMIN_WRITE]),
  admin: grants(ALL_READ, [...MANAGER_WRITE, ...STAFF_WRITE, ...ADMIN_WRITE]),
  manager: grants(ALL_READ, MANAGER_WRITE),
  staff: grants(ALL_READ, STAFF_WRITE),
  viewer: grants(ALL_READ),
};

export function canManager(role: TeamRole, action: ManagerAction): boolean {
  return ROLE_ACTIONS[role].has(action);
}
