import {
  clearSessionCookie,
  destroySession,
  readSessionId,
} from "@/lib/server/session";
import { dropPlaygroundSession } from "@/lib/server/playground-store";
import { apiRoute } from "@/lib/server/api-route";
import { jsonOk } from "@/lib/server/http";

export const POST = apiRoute(async () => {
  const sessionId = await readSessionId();
  destroySession(sessionId);
  dropPlaygroundSession();
  const response = jsonOk({ ok: true });
  clearSessionCookie(response);
  return response;
});
