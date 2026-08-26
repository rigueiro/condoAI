import type { Equipment, MaintenanceContract, Vendor } from "@/types";
import {
  deleteContract,
  deleteEquipment,
  deleteVendor,
  getOperations,
  putContract,
  putEquipment,
  putVendor,
} from "@/lib/server/operations";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";

function hasCondoEntity<T extends { id?: string; condominiumId?: string }>(
  entity: T | undefined,
): entity is T & { id: string; condominiumId: string } {
  return Boolean(entity?.id && entity.condominiumId);
}

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readOperations");
    return jsonOk({ state: getOperations(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeOperations");
    const body = (await request.json()) as {
      action?: string;
      vendor?: Vendor;
      contract?: MaintenanceContract;
      equipment?: Equipment;
      id?: string;
    };

    switch (body.action) {
      case "upsertVendor":
        return hasCondoEntity(body.vendor)
          ? jsonOk({ state: putVendor(workspaceEmail, body.vendor) })
          : jsonError("badRequest");
      case "removeVendor":
        return body.id
          ? jsonOk({ state: deleteVendor(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "upsertContract":
        return hasCondoEntity(body.contract) && body.contract.vendorId
          ? jsonOk({ state: putContract(workspaceEmail, body.contract) })
          : jsonError("badRequest");
      case "removeContract":
        return body.id
          ? jsonOk({ state: deleteContract(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "upsertEquipment":
        return hasCondoEntity(body.equipment)
          ? jsonOk({ state: putEquipment(workspaceEmail, body.equipment) })
          : jsonError("badRequest");
      case "removeEquipment":
        return body.id
          ? jsonOk({ state: deleteEquipment(workspaceEmail, body.id) })
          : jsonError("badRequest");
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
