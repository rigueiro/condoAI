import { NextResponse } from "next/server";
import type { Condominium } from "@/types";
import {
  getCondominium,
  removeCondominium,
  upsertCondominium,
} from "@/lib/server/portfolio";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const condominium = getCondominium(email, id);
    if (!condominium) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }
    return jsonOk({ condominium });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const body = (await request.json()) as { condominium?: Condominium };
    if (!body.condominium || body.condominium.id !== id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertCondominium(email, body.condominium);
    return jsonOk({ portfolio, condominium: body.condominium });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const portfolio = removeCondominium(email, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
}
