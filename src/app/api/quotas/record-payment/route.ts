import { NextResponse } from "next/server";
import {
  recordPayment,
  type RecordPaymentInput,
} from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("recordPayment");
    const body = (await request.json()) as RecordPaymentInput;
    const result = recordPayment(workspaceEmail, body);
    if (!result) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    return jsonOk({
      quotaId: result.quotaId,
      state: result.state,
    });
  } catch (err) {
    return handleRouteError(err);
  }
})
