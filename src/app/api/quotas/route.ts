import type { QuotaPayment } from "@/types";
import {
  createQuota,
  getCollections,
  issueOrdinaryQuotas,
} from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

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
      return jsonError("badRequest");
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

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const body = (await request.json()) as {
      action?: string;
      condominiumId?: string;
      monthYear?: string;
    };
    if (body.action !== "issueOrdinary" || !body.condominiumId || !body.monthYear) {
      return jsonError("badRequest");
    }
    const { state, result } = issueOrdinaryQuotas(workspaceEmail, {
      condominiumId: body.condominiumId,
      monthYear: body.monthYear,
    });
    return jsonOk({ state, quotas: state.quotas, result });
  } catch (err) {
    return handleRouteError(err);
  }
}
