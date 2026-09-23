import { NextResponse } from "next/server";
import { changePassword, resolveUser } from "@/lib/server/auth";
import {
  getSessionFromStore,
  readSessionId,
} from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const sessionId = await readSessionId();
    const session = getSessionFromStore(sessionId);
    if (!session) {
      return NextResponse.json({ error: "notAuthenticated" }, { status: 401 });
    }
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    changePassword(
      session.email,
      body.currentPassword ?? "",
      body.newPassword ?? "",
    );
    return jsonOk({ user: resolveUser(session.email) });
  } catch (err) {
    return handleRouteError(err);
  }
})
