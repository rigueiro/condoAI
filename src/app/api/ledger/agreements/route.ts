import {
  cancelPaymentAgreement,
  createPaymentAgreement,
  defaultPaymentAgreement,
  payAgreementInstallment,
} from "@/lib/server/collections";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type {
  CreateAgreementInput,
  PayInstallmentInput,
} from "@/lib/collections/types";

export async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    const body = (await request.json()) as CreateAgreementInput;
    if (!body.ownerId || body.installmentCount == null) {
      return jsonError("badRequest");
    }
    return jsonOk(createPaymentAgreement(workspaceEmail, body), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as PayInstallmentInput & {
      action?: string;
      agreementId?: string;
    };
    if (!body.agreementId || !body.action) {
      return jsonError("badRequest");
    }

    if (body.action === "payInstallment") {
      const { workspaceEmail } = await requireManagerAccess("recordPayment");
      if (!body.installmentId) return jsonError("badRequest");
      return jsonOk(payAgreementInstallment(workspaceEmail, body));
    }

    const { workspaceEmail } = await requireManagerAccess("writeCollections");
    if (body.action === "default") {
      return jsonOk(defaultPaymentAgreement(workspaceEmail, body.agreementId));
    }
    if (body.action === "cancel") {
      return jsonOk(cancelPaymentAgreement(workspaceEmail, body.agreementId));
    }
    return jsonError("badRequest");
  } catch (err) {
    return handleRouteError(err);
  }
}
