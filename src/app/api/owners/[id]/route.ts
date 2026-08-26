import { NextResponse } from "next/server";
import type { Owner } from "@/types";
import {
  getOwner,
  removeOwner,
  upsertOwner,
} from "@/lib/server/portfolio";
import type { OccupancyLink } from "@/lib/portfolio/occupancy";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const { id } = await context.params;
    const owner = getOwner(workspaceEmail, id);
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
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const body = (await request.json()) as {
      owner?: Owner;
      occupancies?: OccupancyLink[];
    };
    if (!body.owner || body.owner.id !== id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertOwner(workspaceEmail, body.owner, body.occupancies);
    return jsonOk({ portfolio, owner: body.owner });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const { id } = await context.params;
    const portfolio = removeOwner(workspaceEmail, id);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
}
