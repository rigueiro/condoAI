import { DEMO_EMAIL } from "@/lib/auth/constants";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { startPlaygroundSession } from "@/lib/server/playground-session";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError } from "@/lib/server/http";

/** Starts an isolated manager playground seeded with demo fixtures. */
export const POST = apiRoute(async () => {
  if (!isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  return startPlaygroundSession(DEMO_EMAIL);
});
