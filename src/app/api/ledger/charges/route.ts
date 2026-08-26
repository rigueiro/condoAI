import { NextResponse } from "next/server";
import { addCharge } from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const body = (await request.json()) as {
      ownerId?: string;
      condominiumId?: string;
      date?: string;
      kind?: string;
      description?: string;
      amount?: number | string;
    };
    if (!body.ownerId || body.amount == null) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const state = addCharge(workspaceEmail, {
      ownerId: body.ownerId,
      condominiumId: body.condominiumId,
      date: body.date,
      kind: body.kind,
      description: body.description,
      amount: body.amount,
    });
    return jsonOk({ state }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
