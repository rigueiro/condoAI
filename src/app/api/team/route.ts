import { NextResponse } from "next/server";
import { requireManagerAccess } from "@/lib/server/manager-access";
import {
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
  toTeamMemberView,
} from "@/lib/server/org-team";
import { isAssignableTeamRole } from "@/lib/team/types";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { apiRoute } from "@/lib/server/api-route";

export const GET = apiRoute(async function GET() {
  try {
    const ctx = await requireManagerAccess("readTeam");
    const members = listTeamMembers(ctx.workspaceEmail).map((member) =>
      toTeamMemberView(member, ctx.sessionEmail),
    );
    return jsonOk({
      members,
      canManageTeam: ctx.can("manageTeam"),
    });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const POST = apiRoute(async function POST(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("manageTeam");
    const body = (await request.json()) as {
      email?: string;
      role?: string;
      displayName?: string;
    };
    if (!body.email || !body.role || !isAssignableTeamRole(body.role)) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const member = inviteTeamMember(workspaceEmail, {
      memberEmail: body.email,
      role: body.role,
      displayName: body.displayName,
    });
    return jsonOk({ member }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const PATCH = apiRoute(async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("manageTeam");
    const body = (await request.json()) as { id?: string; role?: string };
    if (!body.id || !body.role || !isAssignableTeamRole(body.role)) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    const member = updateTeamMemberRole(workspaceEmail, body.id, body.role);
    return jsonOk({ member });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const DELETE = apiRoute(async function DELETE(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("manageTeam");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    removeTeamMember(workspaceEmail, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
})
