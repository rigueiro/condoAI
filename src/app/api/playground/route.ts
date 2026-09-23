import { jsonOk } from "@/lib/server/http";
import { isPlaygroundMode } from "@/lib/server/playground-mode";
import { apiRoute } from "@/lib/server/api-route";

/** Public flag so the client can show playground CTAs without a build-time env. */
export const GET = apiRoute(async function GET() {
  return jsonOk({ enabled: isPlaygroundMode() });
})
