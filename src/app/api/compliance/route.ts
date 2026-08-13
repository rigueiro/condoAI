import type {
  AssemblyMinutes,
  Certificate,
  InsurancePolicy,
  Summons,
} from "@/types";
import {
  deleteAssembly,
  deleteCertificate,
  deletePolicy,
  deleteSummons,
  getCompliance,
  markCertificateRenewed,
  markPolicyRenewed,
  putAssembly,
  putCertificate,
  putPolicy,
  putSummons,
} from "@/lib/server/compliance";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function hasCondoEntity<T extends { id?: string; condominiumId?: string }>(
  entity: T | undefined,
): entity is T & { id: string; condominiumId: string } {
  return Boolean(entity?.id && entity.condominiumId);
}

export async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk({ state: getCompliance(email) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      action?: string;
      policy?: InsurancePolicy;
      certificate?: Certificate;
      assembly?: AssemblyMinutes;
      summons?: Summons;
      id?: string;
    };

    switch (body.action) {
      case "upsertPolicy":
        return hasCondoEntity(body.policy)
          ? jsonOk({ state: putPolicy(email, body.policy) })
          : jsonError("badRequest");
      case "removePolicy":
        return body.id
          ? jsonOk({ state: deletePolicy(email, body.id) })
          : jsonError("badRequest");
      case "renewPolicy":
        return body.id
          ? jsonOk({ state: markPolicyRenewed(email, body.id) })
          : jsonError("badRequest");
      case "upsertCertificate":
        return hasCondoEntity(body.certificate)
          ? jsonOk({ state: putCertificate(email, body.certificate) })
          : jsonError("badRequest");
      case "removeCertificate":
        return body.id
          ? jsonOk({ state: deleteCertificate(email, body.id) })
          : jsonError("badRequest");
      case "renewCertificate":
        return body.id
          ? jsonOk({ state: markCertificateRenewed(email, body.id) })
          : jsonError("badRequest");
      case "upsertAssembly":
        return hasCondoEntity(body.assembly)
          ? jsonOk({ state: putAssembly(email, body.assembly) })
          : jsonError("badRequest");
      case "removeAssembly":
        return body.id
          ? jsonOk({ state: deleteAssembly(email, body.id) })
          : jsonError("badRequest");
      case "upsertSummons":
        return hasCondoEntity(body.summons)
          ? jsonOk({ state: putSummons(email, body.summons) })
          : jsonError("badRequest");
      case "removeSummons":
        return body.id
          ? jsonOk({ state: deleteSummons(email, body.id) })
          : jsonError("badRequest");
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
