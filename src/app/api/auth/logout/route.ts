import {
  clearSessionCookie,
  destroySession,
  readSessionId,
} from "@/lib/server/session";
import { jsonOk } from "@/lib/server/http";

export async function POST() {
  const sessionId = await readSessionId();
  destroySession(sessionId);
  const response = jsonOk({ ok: true });
  clearSessionCookie(response);
  return response;
}
