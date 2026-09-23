import { resolveUser } from "@/lib/server/auth";
import { ensurePlaygroundWorkspace } from "@/lib/server/demo";
import { rebindPlaygroundSession } from "@/lib/server/playground-store";
import { applySessionCookie, createSession } from "@/lib/server/session";
import { jsonOk } from "@/lib/server/http";

/** Seed this request's playground store and issue a session cookie. */
export function startPlaygroundSession(email: string) {
  ensurePlaygroundWorkspace();
  const { sessionId } = createSession(email, true);
  rebindPlaygroundSession(sessionId);
  const user = resolveUser(email);
  const response = jsonOk({ user });
  applySessionCookie(response, sessionId, true);
  return response;
}
