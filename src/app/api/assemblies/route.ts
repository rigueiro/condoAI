import type { Assembly } from "@/lib/assemblies/types";
import {
  attachAssemblyProof,
  closeAssembly,
  createAssembly,
  deleteAssembly,
  getAssemblies,
  openAssemblySession,
  putAssembly,
  recordAssemblyDelivery,
  resendAssemblySummons,
  sendAssemblySummons,
} from "@/lib/server/assemblies";
import { syncWorksFromAssembly } from "@/lib/server/works";
import { resolveSummonsSigner } from "@/lib/server/board";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function hasId<T extends { id?: string }>(
  value: T,
): value is T & { id: string } {
  return Boolean(value.id);
}

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readAssemblies");
    return jsonOk({ state: getAssemblies(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeAssemblies");
    const body = (await request.json()) as {
      action?: string;
      assembly?: Assembly;
      id?: string;
      call?: 1 | 2;
      condominiumId?: string;
      type?: "ordinary" | "extraordinary";
      title?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      location?: string;
      method?: "email" | "mail";
      content?: string;
      sentDate?: string;
      proof?: string | null;
      emailed?: number;
      skipped?: number;
      lastAt?: string | null;
      signedByOwnerId?: string | null;
    };

    switch (body.action) {
      case "upsert":
        return body.assembly?.id && body.assembly.condominiumId
          ? jsonOk({ state: putAssembly(workspaceEmail, body.assembly) })
          : jsonError("badRequest");
      case "remove":
        return body.id
          ? jsonOk({ state: deleteAssembly(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "create":
        return body.condominiumId && body.title && body.scheduledDate
          ? jsonOk({
              state: createAssembly(workspaceEmail, {
                condominiumId: body.condominiumId,
                type:
                  body.type === "extraordinary" ? "extraordinary" : "ordinary",
                title: body.title,
                scheduledDate: body.scheduledDate,
                scheduledTime: body.scheduledTime,
                location: body.location ?? "",
              }),
            })
          : jsonError("badRequest");
      case "sendSummons":
        if (!hasId(body)) return jsonError("badRequest");
        {
          const current = getAssemblies(workspaceEmail).assemblies.find(
            (row) => row.id === body.id,
          );
          const signer = current
            ? resolveSummonsSigner(
                workspaceEmail,
                current.condominiumId,
                typeof body.signedByOwnerId === "string"
                  ? body.signedByOwnerId
                  : null,
              )
            : null;
          return jsonOk({
            state: sendAssemblySummons(workspaceEmail, {
              id: body.id,
              method: body.method === "mail" ? "mail" : "email",
              title: body.title ?? "",
              content: body.content ?? "",
              sentDate: body.sentDate,
              proof: body.proof,
              signer,
            }),
          });
        }
      case "resendSummons":
        return hasId(body)
          ? jsonOk({
              state: resendAssemblySummons(workspaceEmail, {
                id: body.id,
                title: body.title,
                content: body.content,
              }),
            })
          : jsonError("badRequest");
      case "attachProof":
        return hasId(body)
          ? jsonOk({
              state: attachAssemblyProof(workspaceEmail, {
                id: body.id,
                proof: body.proof ?? null,
              }),
            })
          : jsonError("badRequest");
      case "recordDelivery":
        return hasId(body) &&
          typeof body.emailed === "number" &&
          typeof body.skipped === "number"
          ? jsonOk({
              state: recordAssemblyDelivery(workspaceEmail, {
                id: body.id,
                emailed: body.emailed,
                skipped: body.skipped,
                lastAt: body.lastAt,
              }),
            })
          : jsonError("badRequest");
      case "openSession":
        return body.id
          ? jsonOk({
              state: openAssemblySession(workspaceEmail, body.id, body.call),
            })
          : jsonError("badRequest");
      case "close": {
        if (!body.id) return jsonError("badRequest");
        const state = closeAssembly(workspaceEmail, body.id);
        const closed = state.assemblies.find((row) => row.id === body.id);
        if (closed) syncWorksFromAssembly(workspaceEmail, closed);
        return jsonOk({ state });
      }
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
