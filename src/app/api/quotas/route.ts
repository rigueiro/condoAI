import { NextResponse } from "next/server";
import type { QuotaPayment } from "@/types";
import {
  createQuota,
  getCollections,
} from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readCollections");
    const state = getCollections(workspaceEmail);
    return jsonOk({ quotas: state.quotas, details: state.details, state });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const body = (await request.json()) as {
      quota?: Omit<QuotaPayment, "id"> & { id?: string };
    };
    if (!body.quota?.ownerId || body.quota.amount == null) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const state = createQuota(workspaceEmail, {
      monthYear: body.quota.monthYear,
      amount: body.quota.amount,
      status: body.quota.status ?? "pending",
      paymentDate: body.quota.paymentDate ?? null,
      ownerId: body.quota.ownerId,
      id: body.quota.id,
    });
    return jsonOk({ state, quotas: state.quotas }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
