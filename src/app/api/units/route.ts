import type { Unit } from "@/types";
import { unitsForCondominium } from "@/lib/portfolio/units";
import { getPortfolio, upsertUnit } from "@/lib/server/portfolio";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    const allUnits = getPortfolio(email).units;
    const units = condominiumId
      ? unitsForCondominium(allUnits, condominiumId)
      : allUnits;
    return jsonOk({ units });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as { unit?: Unit };
    if (!body.unit?.id || !body.unit.condominiumId) {
      return jsonError("badRequest");
    }
    const portfolio = upsertUnit(email, body.unit);
    return jsonOk({ portfolio, unit: body.unit }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
