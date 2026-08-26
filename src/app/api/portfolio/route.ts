import { NextResponse } from "next/server";
import type { Organization } from "@/app/[locale]/account/types";
import type { Condominium, Owner, Unit } from "@/types";
import {
  applyImport,
  completeOnboarding,
  getPortfolio,
  saveFirstCondominium,
  saveOrganization,
  updateOrganization,
} from "@/lib/server/portfolio";
import { requireManagerAccess } from "@/lib/server/manager-access";
import type { ManagerAction } from "@/lib/team/permissions";
import { handleRouteError, jsonOk } from "@/lib/server/http";

const PATCH_PERMISSION: Record<string, ManagerAction> = {
  saveOrganization: "writeOrganization",
  updateOrganization: "writeOrganization",
  saveFirstCondominium: "writePortfolio",
  applyImport: "writePortfolio",
  completeOnboarding: "writePortfolio",
};

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readPortfolio");
    return jsonOk({ portfolio: getPortfolio(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireManagerAccess();
    const body = (await request.json()) as {
      action?: string;
      organization?: Organization;
      condominium?: Condominium;
      units?: Unit[];
      owners?: Owner[];
    };

    const permission = body.action ? PATCH_PERMISSION[body.action] : undefined;
    if (!permission || !ctx.can(permission)) {
      throw new Error("forbidden");
    }

    const { workspaceEmail } = ctx;

    switch (body.action) {
      case "saveOrganization": {
        if (!body.organization) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: saveOrganization(workspaceEmail, body.organization),
        });
      }
      case "saveFirstCondominium": {
        if (!body.condominium) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: saveFirstCondominium(workspaceEmail, body.condominium),
        });
      }
      case "applyImport":
        return jsonOk({
          portfolio: applyImport(
            workspaceEmail,
            body.units ?? [],
            body.owners ?? [],
          ),
        });
      case "completeOnboarding":
        return jsonOk({ portfolio: completeOnboarding(workspaceEmail) });
      case "updateOrganization": {
        if (!body.organization) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: updateOrganization(workspaceEmail, body.organization),
        });
      }
      default:
        return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
