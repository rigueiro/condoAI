import { NextResponse } from "next/server";
import type { User } from "@/app/types";
import { updateAccountProfile } from "@/lib/server/auth";
import {
  getSessionFromStore,
  readSessionId,
} from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

/** PATCH profile fields for the signed-in user. */
export const PATCH = apiRoute(async function PATCH(request: Request) {
  try {
    const sessionId = await readSessionId();
    const session = getSessionFromStore(sessionId);
    if (!session) {
      return NextResponse.json({ error: "notAuthenticated" }, { status: 401 });
    }
    const body = (await request.json()) as Partial<
      Pick<User, "name" | "role" | "avatar" | "phone">
    >;
    const user = updateAccountProfile(session.email, body);
    return jsonOk({ user });
  } catch (err) {
    return handleRouteError(err);
  }
})
