import { NextResponse } from "next/server";
import { issueCertificate } from "@/lib/server/collections";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      ownerId?: string;
      condominiumId?: string;
      asOfDate?: string;
    };
    if (!body.ownerId) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const result = issueCertificate(email, {
      ownerId: body.ownerId,
      condominiumId: body.condominiumId,
      asOfDate: body.asOfDate,
    });
    return jsonOk(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
