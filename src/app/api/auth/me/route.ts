import { resolveUser } from "@/lib/server/auth";
import {
  getSessionFromStore,
  readSessionId,
} from "@/lib/server/session";
import { jsonError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET() {
  const sessionId = await readSessionId();
  const session = getSessionFromStore(sessionId);
  if (!session) {
    return jsonError("unauthorized", 401);
  }
  try {
    const user = resolveUser(session.email);
    return jsonOk({ user });
  } catch {
    return jsonError("unauthorized", 401);
  }
})
