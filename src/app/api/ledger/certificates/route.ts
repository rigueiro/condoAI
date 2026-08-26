import { NextResponse } from "next/server";
import { issueCertificate } from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("issueDebtCertificate");
    const body = (await request.json()) as {
      ownerId?: string;
      condominiumId?: string;
      asOfDate?: string;
    };
    if (!body.ownerId) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const result = issueCertificate(workspaceEmail, {
      ownerId: body.ownerId,
      condominiumId: body.condominiumId,
      asOfDate: body.asOfDate,
    });
    return jsonOk(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
