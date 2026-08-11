import { NextResponse } from "next/server";
import type { Condominium } from "@/types";
import {
  getPortfolio,
  upsertCondominium,
} from "@/lib/server/portfolio";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const email = await requireSessionEmail();
    const portfolio = getPortfolio(email);
    return jsonOk({ condominiums: portfolio.condominiums });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as { condominium?: Condominium };
    if (!body.condominium?.id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertCondominium(email, body.condominium);
    return jsonOk({ portfolio, condominium: body.condominium }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
