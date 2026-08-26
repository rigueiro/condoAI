import type { Certificate, InsurancePolicy, LegalProcess } from "@/types";
import {
  deleteCertificate,
  deletePolicy,
  getCompliance,
  markCertificateRenewed,
  markPolicyRenewed,
  putCertificate,
  putPolicy,
} from "@/lib/server/compliance";
import {
  listLegalProcesses,
  openLegalProcess,
  seedDemoLegalProcesses,
  updateLegalProcess,
} from "@/lib/server/legal-processes";
import { requireManagerAccess } from "@/lib/server/manager-access";
import type { ManagerAction } from "@/lib/team/permissions";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function hasCondoEntity<T extends { id?: string; condominiumId?: string }>(
  entity: T | undefined,
): entity is T & { id: string; condominiumId: string } {
  return Boolean(entity?.id && entity.condominiumId);
}

const PATCH_PERMISSION: Record<string, ManagerAction> = {
  upsertPolicy: "writeCompliance",
  removePolicy: "writeCompliance",
  renewPolicy: "writeCompliance",
  upsertCertificate: "writeCompliance",
  removeCertificate: "writeCompliance",
  renewCertificate: "writeCompliance",
  openLegalProcess: "manageLegal",
  updateLegalProcess: "manageLegal",
};

export async function GET() {
  try {
    const ctx = await requireManagerAccess("readCompliance");
    seedDemoLegalProcesses(ctx.workspaceEmail);
    return jsonOk({
      state: getCompliance(ctx.workspaceEmail),
      legalProcesses: listLegalProcesses(ctx.workspaceEmail),
      canManageLegal: ctx.can("manageLegal"),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireManagerAccess();
    const body = (await request.json()) as {
      action?: string;
      policy?: InsurancePolicy;
      certificate?: Certificate;
      id?: string;
      ownerId?: string;
      condominiumId?: string;
      certificateId?: string | null;
      description?: string;
      documents?: string[];
      status?: LegalProcess["status"];
    };

    const permission = body.action ? PATCH_PERMISSION[body.action] : undefined;
    if (!permission || !ctx.can(permission)) {
      throw new Error("forbidden");
    }

    const { workspaceEmail } = ctx;

    switch (body.action) {
      case "upsertPolicy":
        return hasCondoEntity(body.policy)
          ? jsonOk({ state: putPolicy(workspaceEmail, body.policy) })
          : jsonError("badRequest");
      case "removePolicy":
        return body.id
          ? jsonOk({ state: deletePolicy(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "renewPolicy":
        return body.id
          ? jsonOk({ state: markPolicyRenewed(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "upsertCertificate":
        return hasCondoEntity(body.certificate)
          ? jsonOk({ state: putCertificate(workspaceEmail, body.certificate) })
          : jsonError("badRequest");
      case "removeCertificate":
        return body.id
          ? jsonOk({ state: deleteCertificate(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "renewCertificate":
        return body.id
          ? jsonOk({ state: markCertificateRenewed(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "openLegalProcess":
        return body.ownerId
          ? jsonOk({
              process: openLegalProcess(workspaceEmail, {
                ownerId: body.ownerId,
                condominiumId: body.condominiumId,
                certificateId: body.certificateId,
                description: body.description,
                documents: body.documents,
              }),
            })
          : jsonError("badRequest");
      case "updateLegalProcess":
        return body.id
          ? jsonOk({
              process: updateLegalProcess(workspaceEmail, body.id, {
                description: body.description,
                status: body.status,
                documents: body.documents,
              }),
            })
          : jsonError("badRequest");
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
