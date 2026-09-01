import type { OccupancyRole, Owner, Unit } from "@/types";
import type { Portfolio } from "./types";
import { occupanciesForOwner, normalizeOccupancies } from "./occupancy";
import { roundCurrency } from "@/lib/quota";

export type TransferResult = {
  buyerId: string;
  sellerId: string;
  unitIds: string[];
  saleDate: string;
  certificateNumber: string | null;
  certificateTotal: number;
  settledAmount: number;
  receiptsIssued: number;
  openingBalance: number;
  portalRevoked: number;
  portalInvited: boolean;
};

export type TransferBuyerInput =
  | { mode: "existing"; ownerId: string }
  | {
      mode: "new";
      fullName: string;
      taxId?: string;
      email?: string;
      phone?: string;
    };

export type TransferInput = {
  sellerId: string;
  unitIds: string[];
  saleDate: string;
  buyer: TransferBuyerInput;
  issueCertificate?: boolean;
  settleSeller?: boolean;
  openingBalance?: number | string;
  handoffPortal?: boolean;
};

export type TransferPreview = {
  tenants: { unitLabel: string; ownerId: string; role: OccupancyRole }[];
  sellerRemainingOwnerUnits: number;
};

function ownerRolePermillage(unit: Unit, ownerId: string): number {
  const occupancy = (unit.occupancies ?? []).find(
    (item) => item.ownerId === ownerId && item.role === "owner",
  );
  return occupancy ? Number(unit.permillage) || 0 : 0;
}

export function selectSoldUnits(
  units: Unit[],
  sellerId: string,
  unitIds: string[],
): { ids: string[]; condominiumId: string } {
  const unique = [...new Set(unitIds.filter(Boolean))];
  if (unique.length === 0) throw new Error("unitsRequired");

  let condominiumId = "";
  for (const id of unique) {
    const unit = units.find((item) => item.id === id);
    if (!unit) throw new Error("unitNotFound");
    if (ownerRolePermillage(unit, sellerId) <= 0) {
      throw new Error("notOwnerOfUnit");
    }
    if (!condominiumId) condominiumId = unit.condominiumId;
    else if (unit.condominiumId !== condominiumId) {
      throw new Error("multipleCondominiums");
    }
  }
  return { ids: unique, condominiumId };
}

/** Move owner role on the sold fractions to the buyer; keep tenants. */
function transferUnitOwnership(
  units: Unit[],
  sold: Set<string>,
  sellerId: string,
  buyerId: string,
): Unit[] {
  return units.map((unit) => {
    if (!sold.has(unit.id)) return unit;
    const occupancies = normalizeOccupancies(unit.occupancies);
    const kept = occupancies.filter(
      (item) => item.ownerId !== sellerId && item.ownerId !== buyerId,
    );
    return {
      ...unit,
      occupancies: [...kept, { ownerId: buyerId, role: "owner" as const }],
    };
  });
}

export function previewSaleTransfer(
  units: Unit[],
  sellerId: string,
  unitIds: string[],
): TransferPreview {
  const sold = new Set(unitIds);
  const tenants: TransferPreview["tenants"] = [];
  let remaining = 0;
  for (const unit of units) {
    const occupancy = (unit.occupancies ?? []).find(
      (item) => item.ownerId === sellerId,
    );
    if (!occupancy || occupancy.role !== "owner") continue;
    if (sold.has(unit.id)) {
      for (const item of unit.occupancies ?? []) {
        if (item.ownerId === sellerId || item.role === "owner") continue;
        tenants.push({
          unitLabel: unit.label,
          ownerId: item.ownerId,
          role: item.role,
        });
      }
    } else {
      remaining += 1;
    }
  }
  return { tenants, sellerRemainingOwnerUnits: remaining };
}

export function applySaleTransfer(
  portfolio: Portfolio,
  sellerId: string,
  buyer: Owner,
  unitIds: string[],
  saleDate: string,
): Portfolio {
  const { ids } = selectSoldUnits(portfolio.units, sellerId, unitIds);
  const sold = new Set(ids);
  let before = 0;
  let transferred = 0;
  for (const unit of portfolio.units) {
    const permillage = ownerRolePermillage(unit, sellerId);
    if (permillage <= 0) continue;
    before += permillage;
    if (sold.has(unit.id)) transferred += permillage;
  }
  const share = before > 0 ? transferred / before : 0;

  const units = transferUnitOwnership(
    portfolio.units,
    sold,
    sellerId,
    buyer.id,
  );
  const seller = portfolio.owners.find((item) => item.id === sellerId);
  if (!seller) throw new Error("notFound");

  const remainingOwner = occupanciesForOwner(units, sellerId).some(
    (row) => row.role === "owner",
  );
  const slice = roundCurrency(seller.monthlyQuota * share);
  const nextSeller: Owner = {
    ...seller,
    monthlyQuota: remainingOwner
      ? roundCurrency(seller.monthlyQuota - slice)
      : 0,
    exitDate: remainingOwner ? seller.exitDate : saleDate,
  };

  const existingBuyer = portfolio.owners.find((item) => item.id === buyer.id);
  const nextBuyer: Owner = {
    ...(existingBuyer ?? buyer),
    ...buyer,
    monthlyQuota: roundCurrency((existingBuyer?.monthlyQuota ?? 0) + slice),
    entryDate: existingBuyer?.entryDate ?? saleDate,
    exitDate: null,
  };

  return {
    ...portfolio,
    units,
    owners: [
      nextSeller,
      nextBuyer,
      ...portfolio.owners.filter(
        (item) => item.id !== sellerId && item.id !== buyer.id,
      ),
    ],
  };
}
