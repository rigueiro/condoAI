import { NextResponse } from "next/server";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import {
  inviteMembership,
  listMembershipsForHost,
  revokeMembership,
} from "@/lib/server/memberships";
import { isCondoAssignableRole } from "@/lib/memberships/types";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("managePortalAccess");
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    let memberships = listMembershipsForHost(workspaceEmail).filter(
      (m) => m.status !== "inactive",
    );
    if (condominiumId) {
      memberships = memberships.filter((m) => m.condominiumId === condominiumId);
    }
    return jsonOk({ memberships });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("managePortalAccess");
    const body = (await request.json()) as {
      memberEmail?: string;
      condominiumId?: string;
      role?: string;
      ownerId?: string | null;
      displayName?: string;
    };
    if (
      !body.memberEmail ||
      !body.condominiumId ||
      !body.role ||
      !body.displayName ||
      !isCondoAssignableRole(body.role)
    ) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const membership = inviteMembership(workspaceEmail, {
      memberEmail: body.memberEmail,
      condominiumId: body.condominiumId,
      role: body.role,
      ownerId: body.ownerId ?? null,
      displayName: body.displayName,
    });
    return jsonOk({ membership }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const DELETE = apiRoute(async function DELETE(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("managePortalAccess");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    revokeMembership(workspaceEmail, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
})
