import type { Unit } from "@/types";
import { getUnit, removeUnit, upsertUnit } from "@/lib/server/portfolio";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiRoute(async function GET(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const { id } = await context.params;
    const unit = getUnit(workspaceEmail, id);
    if (!unit) {
      return jsonError("notFound", 404);
    }
    return jsonOk({ unit });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const PUT = apiRoute(async function PUT(request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const body = (await request.json()) as { unit?: Unit };
    if (!body.unit || body.unit.id !== id) {
      return jsonError("badRequest");
    }
    const portfolio = upsertUnit(workspaceEmail, body.unit);
    return jsonOk({ portfolio, unit: body.unit });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const DELETE = apiRoute(async function DELETE(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const portfolio = removeUnit(workspaceEmail, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
})
