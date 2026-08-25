import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import {
  portalApproveBudget,
  portalBudget,
} from "@/lib/server/memberships";

export async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    if (!condominiumId) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    return jsonOk(portalBudget(email, condominiumId));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      action?: string;
      condominiumId?: string;
      budgetId?: string;
    };
    if (body.action !== "approveBudget" || !body.condominiumId || !body.budgetId) {
      return jsonError("badRequest");
    }
    return jsonOk(
      portalApproveBudget(email, body.condominiumId, body.budgetId),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
