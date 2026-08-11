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
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    const email = await requireSessionEmail();
    const portfolio = getPortfolio(email);
    return jsonOk({ portfolio });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
    const body = (await request.json()) as {
      action?: string;
      organization?: Organization;
      condominium?: Condominium;
      units?: Unit[];
      owners?: Owner[];
    };

    switch (body.action) {
      case "saveOrganization": {
        if (!body.organization) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: saveOrganization(email, body.organization),
        });
      }
      case "saveFirstCondominium": {
        if (!body.condominium) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: saveFirstCondominium(email, body.condominium),
        });
      }
      case "applyImport": {
        return jsonOk({
          portfolio: applyImport(
            email,
            body.units ?? [],
            body.owners ?? [],
          ),
        });
      }
      case "completeOnboarding": {
        return jsonOk({ portfolio: completeOnboarding(email) });
      }
      case "updateOrganization": {
        if (!body.organization) {
          return NextResponse.json({ error: "badRequest" }, { status: 400 });
        }
        return jsonOk({
          portfolio: updateOrganization(email, body.organization),
        });
      }
      default:
        return NextResponse.json({ error: "badRequest" }, { status: 400 });
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
