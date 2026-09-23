import { NextResponse } from "next/server";
import type { QuotaPayment } from "@/types";
import {
  deleteQuota,
  getCollections,
  upsertQuota,
} from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = apiRoute(async function PUT(request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const { id } = await context.params;
    const body = (await request.json()) as { quota?: QuotaPayment };
    if (!body.quota || body.quota.id !== id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const state = upsertQuota(workspaceEmail, body.quota);
    return jsonOk({ state, quota: body.quota });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const DELETE = apiRoute(async function DELETE(_request: Request, context: Ctx) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const { id } = await context.params;
    const before = getCollections(workspaceEmail);
    if (!before.quotas.some((q) => q.id === id)) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }
    const state = deleteQuota(workspaceEmail, id);
    return jsonOk({ state });
  } catch (err) {
    return handleRouteError(err);
  }
})
