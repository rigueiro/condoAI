/** Shared auth constants (safe for client and server). */

export const DEMO_EMAIL = "admin@condoai.pt";
export const DEFAULT_PASSWORD = "admin123";
/** Shared minimum length for login, reset, and profile password changes. */
export const MIN_PASSWORD_LENGTH = 8;

/** httpOnly session cookie name. */
export const SESSION_COOKIE = "condoai.session";

export const isDemoEmail = (email: string): boolean =>
  email.trim().toLowerCase() === DEMO_EMAIL;
