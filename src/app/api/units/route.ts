import type { Unit } from "@/types";
import { unitsForCondominium } from "@/lib/portfolio/units";
import { getPortfolio, upsertUnit } from "@/lib/server/portfolio";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    const allUnits = getPortfolio(workspaceEmail).units;
    const units = condominiumId
      ? unitsForCondominium(allUnits, condominiumId)
      : allUnits;
    return jsonOk({ units });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const body = (await request.json()) as { unit?: Unit };
    if (!body.unit?.id || !body.unit.condominiumId) {
      return jsonError("badRequest");
    }
    const portfolio = upsertUnit(workspaceEmail, body.unit);
    return jsonOk({ portfolio, unit: body.unit }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
})
