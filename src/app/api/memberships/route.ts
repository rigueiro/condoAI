import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import {
  inviteMembership,
  isManagerAccount,
  listMembershipsForHost,
  revokeMembership,
} from "@/lib/server/memberships";
import { isCondoAssignableRole } from "@/lib/memberships/types";

async function requireManagerEmail(): Promise<string> {
  const email = await requireSessionEmail();
  if (!isManagerAccount(email)) {
    throw new Error("forbidden");
  }
  return email;
}

export async function GET(request: Request) {
  try {
    const email = await requireManagerEmail();
    const condominiumId = new URL(request.url).searchParams.get(
      "condominiumId",
    );
    let memberships = listMembershipsForHost(email).filter(
      (m) => m.status !== "inactive",
    );
    if (condominiumId) {
      memberships = memberships.filter((m) => m.condominiumId === condominiumId);
    }
    return jsonOk({ memberships });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireManagerEmail();
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
    const membership = inviteMembership(email, {
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
}

export async function DELETE(request: Request) {
  try {
    const email = await requireManagerEmail();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
    revokeMembership(email, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
