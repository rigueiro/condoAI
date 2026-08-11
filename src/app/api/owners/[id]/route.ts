import { NextResponse } from "next/server";
import type { Owner, Unit } from "@/types";
import {
  getOwner,
  removeOwner,
  upsertOwner,
} from "@/lib/server/portfolio";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const owner = getOwner(email, id);
    if (!owner) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }
    return jsonOk({ owner });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const body = (await request.json()) as {
      owner?: Owner;
      unit?: Unit;
    };
    if (!body.owner || body.owner.id !== id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertOwner(email, body.owner, body.unit);
    return jsonOk({ portfolio, owner: body.owner });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const portfolio = removeOwner(email, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
}
