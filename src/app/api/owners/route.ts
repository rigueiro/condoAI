import { NextResponse } from "next/server";
import type { Owner } from "@/types";
import {
  getPortfolio,
  upsertOwner,
} from "@/lib/server/portfolio";
import type { OccupancyLink } from "@/lib/portfolio/occupancy";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const email = await requireSessionEmail();
    const portfolio = getPortfolio(email);
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
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      owner?: Owner;
      occupancies?: OccupancyLink[];
    };
    if (!body.owner?.id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const portfolio = upsertOwner(email, body.owner, body.occupancies);
    return jsonOk({ portfolio, owner: body.owner }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
