import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import {
  portalAddOccurrenceComment,
  portalCreateOccurrence,
  portalOccurrences,
} from "@/lib/server/memberships";

function condoIdFromRequest(request: Request): string | null {
  return new URL(request.url).searchParams.get("condominiumId");
}

export async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId = condoIdFromRequest(request);
    if (!condominiumId) return jsonError("badRequest");
    return jsonOk(portalOccurrences(email, condominiumId));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      condominiumId?: string;
      title?: unknown;
      description?: unknown;
      category?: unknown;
      unit?: unknown;
      photos?: unknown;
    };
    if (!body.condominiumId) return jsonError("badRequest");
    return jsonOk(
      portalCreateOccurrence(email, {
        condominiumId: body.condominiumId,
        title: body.title,
        description: body.description,
        category: body.category,
        unit: body.unit,
        photos: body.photos,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      action?: string;
      condominiumId?: string;
      occurrenceId?: string;
      message?: unknown;
    };
    if (
      body.action !== "addComment" ||
      !body.condominiumId ||
      !body.occurrenceId
    ) {
      return jsonError("badRequest");
    }
    return jsonOk(
      portalAddOccurrenceComment(
        email,
        body.condominiumId,
        body.occurrenceId,
        body.message,
      ),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
