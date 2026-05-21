export enum UserRole {
  SuperAdmin = "SUPER_ADMIN", // App-wide admin (property management company)
  PropertyManager = "PROPERTY_MANAGER", // Manages one or multiple buildings
  BoardMember = "BOARD_MEMBER", // Condo board / committee
  Staff = "STAFF", // Maintenance, concierge, security
  Resident = "RESIDENT", // Owner or tenant
  Tenant = "TENANT", // Non-owner renter
}

/**
 * Canonical user shape used everywhere in the app.
 * The `role` is a display-friendly label (e.g. "Property Manager"); when we
 * adopt a real auth backend we should also expose `roleCode: UserRole`.
 */
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

/**
 * Add company rate and condominium rate
 * users can see how many condos they are managing
 * company users can see condo rating
 */
