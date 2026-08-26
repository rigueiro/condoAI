import { NextResponse } from "next/server";
import type { Owner } from "@/types";
import {
  getPortfolio,
  upsertOwner,
} from "@/lib/server/portfolio";
import type { OccupancyLink } from "@/lib/portfolio/occupancy";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    const portfolio = getPortfolio(workspaceEmail);
    return jsonOk({
      owners: portfolio.owners,
      units: portfolio.units,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writePortfolio");
    const body = (await request.json()) as {
      owner?: Owner;
      occupancies?: OccupancyLink[];
    };
    if (!body.owner?.id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertOwner(workspaceEmail, body.owner, body.occupancies);
    return jsonOk({ portfolio, owner: body.owner }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
