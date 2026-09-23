import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { portalExtract } from "@/lib/server/memberships";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    if (!condominiumId) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    return jsonOk(portalExtract(email, condominiumId));
  } catch (err) {
    return handleRouteError(err);
  }
})
