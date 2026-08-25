import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { portalOccurrences } from "@/lib/server/memberships";

export async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    if (!condominiumId) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    return jsonOk(portalOccurrences(email, condominiumId));
  } catch (err) {
    return handleRouteError(err);
  }
}
