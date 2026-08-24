import type { Unit } from "@/types";
import { getUnit, removeUnit, upsertUnit } from "@/lib/server/portfolio";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const unit = getUnit(email, id);
    if (!unit) {
      return jsonError("notFound", 404);
    }
    return jsonOk({ unit });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const body = (await request.json()) as { unit?: Unit };
    if (!body.unit || body.unit.id !== id) {
      return jsonError("badRequest");
    }
    const portfolio = upsertUnit(email, body.unit);
    return jsonOk({ portfolio, unit: body.unit });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const portfolio = removeUnit(email, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
}
