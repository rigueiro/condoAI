import type { Assembly } from "@/lib/assemblies/types";
import {
  closeAssembly,
  createAssembly,
  deleteAssembly,
  getAssemblies,
  openAssemblySession,
  putAssembly,
  sendAssemblySummons,
} from "@/lib/server/assemblies";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function hasId<T extends { id?: string }>(
  value: T,
): value is T & { id: string } {
  return Boolean(value.id);
}

export async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk({ state: getAssemblies(email) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
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
    };

    switch (body.action) {
      case "upsert":
        return body.assembly?.id && body.assembly.condominiumId
          ? jsonOk({ state: putAssembly(email, body.assembly) })
          : jsonError("badRequest");
      case "remove":
        return body.id
          ? jsonOk({ state: deleteAssembly(email, body.id) })
          : jsonError("badRequest");
      case "create":
        return body.condominiumId && body.title && body.scheduledDate
          ? jsonOk({
              state: createAssembly(email, {
                condominiumId: body.condominiumId,
                type: body.type === "extraordinary" ? "extraordinary" : "ordinary",
                title: body.title,
                scheduledDate: body.scheduledDate,
                scheduledTime: body.scheduledTime,
                location: body.location ?? "",
              }),
            })
          : jsonError("badRequest");
      case "sendSummons":
        return hasId(body)
          ? jsonOk({
              state: sendAssemblySummons(email, {
                id: body.id,
                method: body.method === "mail" ? "mail" : "email",
                title: body.title ?? "",
                content: body.content ?? "",
                sentDate: body.sentDate,
                proof: body.proof,
              }),
            })
          : jsonError("badRequest");
      case "openSession":
        return body.id
          ? jsonOk({
              state: openAssemblySession(email, body.id, body.call),
            })
          : jsonError("badRequest");
      case "close":
        return body.id
          ? jsonOk({ state: closeAssembly(email, body.id) })
          : jsonError("badRequest");
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
