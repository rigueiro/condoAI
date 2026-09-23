import {
  listSentAnnouncements,
  sendAnnouncement,
} from "@/lib/server/announcements";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type {
  AnnouncementAudience,
  SendAnnouncementInput,
} from "@/lib/announcements/types";
import { apiRoute } from "@/lib/server/api-route";

const AUDIENCES = new Set<AnnouncementAudience>(["all", "owners", "board"]);

export const GET = apiRoute(async function GET(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("readAnnouncements");
    const condominiumId =
      new URL(request.url).searchParams.get("condominiumId") ?? undefined;
    return jsonOk({
      announcements: listSentAnnouncements(workspaceEmail, condominiumId),
    });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeAnnouncements");
    const body = (await request.json()) as Partial<SendAnnouncementInput>;
    const audience = body.audience;
    if (!audience || !AUDIENCES.has(audience)) {
      return jsonError("badRequest");
    }
    const result = sendAnnouncement(workspaceEmail, {
      condominiumId: body.condominiumId ?? "",
      subject: body.subject ?? "",
      body: body.body ?? "",
      audience,
    });
    return jsonOk(result);
  } catch (err) {
    return handleRouteError(err);
  }
})
