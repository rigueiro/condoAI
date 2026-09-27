import { resolveUser } from "@/lib/server/auth";
import {
  ensurePartnerManagerAccount,
  ensurePlaygroundWorkspace,
  PARTNER_MANAGER_EMAIL,
} from "@/lib/server/demo";
import { rebindPlaygroundSession } from "@/lib/server/playground-store";
import { applySessionCookie, createSession } from "@/lib/server/session";
import { jsonOk } from "@/lib/server/http";

/** Seed this request's playground store and issue a session cookie. */
export function startPlaygroundSession(email: string) {
  const key = email.trim().toLowerCase();
  if (key === PARTNER_MANAGER_EMAIL) {
    ensurePartnerManagerAccount(key);
  } else {
    ensurePlaygroundWorkspace();
  }
  const { sessionId } = createSession(email, true);
  rebindPlaygroundSession(sessionId);
  const user = resolveUser(email);
  const response = jsonOk({ user });
  applySessionCookie(response, sessionId, true);
  return response;
}
