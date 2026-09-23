import { restoreDemoWorkspace } from "@/lib/server/demo";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { requireSessionEmail } from "@/lib/server/session";
import { apiRoute } from "@/lib/server/api-route";
import { jsonError, jsonOk } from "@/lib/server/http";

/** Re-seed the current playground session from demo fixtures. */
export const POST = apiRoute(async () => {
  if (!isPlaygroundMode()) {
    return jsonError("playgroundDisabled", 403);
  }
  await requireSessionEmail();
  restoreDemoWorkspace();
  return jsonOk({ ok: true });
});
