import { NextResponse } from "next/server";
import {
  recordPayment,
  type RecordPaymentInput,
} from "@/lib/server/collections";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as RecordPaymentInput;
    const result = recordPayment(email, body);
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
}
