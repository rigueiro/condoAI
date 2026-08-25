import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { buildPortalContext } from "@/lib/server/memberships";

export async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk(buildPortalContext(email));
  } catch (err) {
    return handleRouteError(err);
  }
}
