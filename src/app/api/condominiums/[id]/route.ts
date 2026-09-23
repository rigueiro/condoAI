import { NextResponse } from "next/server";
import type { Condominium } from "@/types";
import {
  getCondominium,
  removeCondominium,
  upsertCondominium,
} from "@/lib/server/portfolio";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiRoute(async function GET(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const { id } = await context.params;
    const condominium = getCondominium(workspaceEmail, id);
    if (!condominium) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }
    return jsonOk({ condominium });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const PUT = apiRoute(async function PUT(request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const body = (await request.json()) as { condominium?: Condominium };
    if (!body.condominium || body.condominium.id !== id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertCondominium(workspaceEmail, body.condominium);
    return jsonOk({ portfolio, condominium: body.condominium });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const DELETE = apiRoute(async function DELETE(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const portfolio = removeCondominium(workspaceEmail, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
})
