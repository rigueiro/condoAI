import {
  listSentAnnouncements,
  sendAnnouncement,
} from "@/lib/server/announcements";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type {
  AnnouncementAudience,
  SendAnnouncementInput,
} from "@/lib/announcements/types";

const AUDIENCES = new Set<AnnouncementAudience>(["all", "owners", "board"]);

export async function GET(request: Request) {
  try {
    const email = await requireSessionEmail();
    const condominiumId =
      new URL(request.url).searchParams.get("condominiumId") ?? undefined;
    return jsonOk({
      announcements: listSentAnnouncements(email, condominiumId),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as Partial<SendAnnouncementInput>;
    const audience = body.audience;
    if (!audience || !AUDIENCES.has(audience)) {
      return jsonError("badRequest");
    }
    const result = sendAnnouncement(email, {
      condominiumId: body.condominiumId ?? "",
      subject: body.subject ?? "",
      body: body.body ?? "",
      audience,
    });
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
