import { NextResponse } from "next/server";
import type { Condominium } from "@/types";
import {
  getPortfolio,
  upsertCondominium,
} from "@/lib/server/portfolio";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const portfolio = getPortfolio(workspaceEmail);
    return jsonOk({ condominiums: portfolio.condominiums });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const body = (await request.json()) as { condominium?: Condominium };
    if (!body.condominium?.id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertCondominium(workspaceEmail, body.condominium);
    return jsonOk({ portfolio, condominium: body.condominium }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
})
