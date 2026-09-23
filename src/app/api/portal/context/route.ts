import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { buildPortalContext } from "@/lib/server/memberships";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk(buildPortalContext(email));
  } catch (err) {
    return handleRouteError(err);
  }
})
