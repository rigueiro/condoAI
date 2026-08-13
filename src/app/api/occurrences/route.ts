import type { Occurrence } from "@/types";
import {
  deleteOccurrences,
  getOccurrences,
  putOccurrence,
  resolveOccurrences,
} from "@/lib/server/occurrences";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function idList(ids: unknown): string[] {
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
}

export async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk({ state: getOccurrences(email) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      action?: string;
      occurrence?: Occurrence;
      ids?: string[];
    };

    switch (body.action) {
      case "upsertOccurrence":
        return body.occurrence?.condominiumId
          ? jsonOk({ state: putOccurrence(email, body.occurrence) })
          : jsonError("badRequest");
      case "removeOccurrences": {
        const ids = idList(body.ids);
        return ids.length > 0
          ? jsonOk({ state: deleteOccurrences(email, ids) })
          : jsonError("badRequest");
      }
      case "markResolved": {
        const ids = idList(body.ids);
        return ids.length > 0
          ? jsonOk({ state: resolveOccurrences(email, ids) })
          : jsonError("badRequest");
      }
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
