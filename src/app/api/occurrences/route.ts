import type { Occurrence } from "@/types";
import {
  deleteOccurrences,
  getOccurrences,
  putOccurrence,
  resolveOccurrences,
} from "@/lib/server/occurrences";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function idList(ids: unknown): string[] {
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
}

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readOccurrences");
    return jsonOk({ state: getOccurrences(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeOccurrences");
    const body = (await request.json()) as {
      action?: string;
      occurrence?: Occurrence;
      ids?: string[];
    };

    switch (body.action) {
      case "upsertOccurrence":
        return body.occurrence?.condominiumId
          ? jsonOk({ state: putOccurrence(workspaceEmail, body.occurrence) })
          : jsonError("badRequest");
      case "removeOccurrences": {
        const ids = idList(body.ids);
        return ids.length > 0
          ? jsonOk({ state: deleteOccurrences(workspaceEmail, ids) })
          : jsonError("badRequest");
      }
      case "markResolved": {
        const ids = idList(body.ids);
        return ids.length > 0
          ? jsonOk({ state: resolveOccurrences(workspaceEmail, ids) })
          : jsonError("badRequest");
      }
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
