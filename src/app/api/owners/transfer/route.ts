import { transferOwnership } from "@/lib/server/transfer";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type { TransferInput } from "@/lib/portfolio/transfer";

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("transferOwnership");
    const body = (await request.json()) as TransferInput;
    if (!body.sellerId || !body.buyer || !Array.isArray(body.unitIds)) {
      return jsonError("badRequest");
    }
    return jsonOk(transferOwnership(workspaceEmail, body), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
