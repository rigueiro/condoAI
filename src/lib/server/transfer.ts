import { UserRole } from "@/app/types";
import { roundCurrency } from "@/lib/quota";
import { todayKey } from "@/lib/collections/dates";
import { addChargeToState, previewDebt } from "@/lib/collections/ledger";
import {
  reassignOpenQuotasAfter,
  settleOwnerAsOf,
} from "@/lib/collections/sale";
import { occupanciesForOwner } from "@/lib/portfolio/occupancy";
import { buildEmptyOwner } from "@/lib/portfolio/mappers";
import {
  selectSoldUnits,
  type TransferInput,
  type TransferResult,
} from "@/lib/portfolio/transfer";
import type { Owner } from "@/types";
import {
  appendCertificate,
  getCollections,
  persistCollections,
} from "./collections";
import {
  inviteMembership,
  listMembershipsForHost,
  revokeMembership,
} from "./memberships";
import { commitSaleTransfer, getPortfolio } from "./portfolio";

function parseAmount(value: number | string | undefined): number {
  if (value == null || value === "") return 0;
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(amount) ? roundCurrency(amount) : 0;
}

function resolveBuyer(
  owners: Owner[],
  sellerId: string,
  input: TransferInput["buyer"],
): Owner {
  if (input.mode === "existing") {
    const owner = owners.find((item) => item.id === input.ownerId);
    if (!owner) throw new Error("notFound");
    if (owner.id === sellerId) throw new Error("sameOwner");
    return owner;
  }
  const fullName = input.fullName?.trim() ?? "";
  if (!fullName) throw new Error("buyerRequired");
  return buildEmptyOwner({
    fullName,
    email: input.email?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    taxId: input.taxId?.trim() ?? "",
  });
}

function handoffPortal(
  host: string,
  condominiumId: string,
  sellerId: string,
  sellerStillOwns: boolean,
  buyer: Owner,
): { portalRevoked: number; portalInvited: boolean } {
  let portalRevoked = 0;
  if (!sellerStillOwns) {
    const toRevoke = listMembershipsForHost(host).filter(
      (membership) =>
        membership.ownerId === sellerId &&
        membership.condominiumId === condominiumId &&
        membership.status !== "inactive",
    );
    for (const membership of toRevoke) {
      revokeMembership(host, membership.id);
      portalRevoked += 1;
    }
  }

  const buyerEmail = buyer.contacts.email.trim().toLowerCase();
  if (!buyerEmail) return { portalRevoked, portalInvited: false };

  try {
    inviteMembership(host, {
      memberEmail: buyerEmail,
      condominiumId,
      role: UserRole.Resident,
      ownerId: buyer.id,
      displayName: buyer.fullName,
    });
    return { portalRevoked, portalInvited: true };
  } catch (err) {
    if (err instanceof Error && err.message === "membershipExists") {
      return { portalRevoked, portalInvited: false };
    }
    throw err;
  }
}

export function transferOwnership(
  email: string,
  input: TransferInput,
): {
  portfolio: ReturnType<typeof getPortfolio>;
  state: ReturnType<typeof getCollections>;
  result: TransferResult;
} {
  const sellerId = input.sellerId?.trim() ?? "";
  const saleDate = input.saleDate?.slice(0, 10) || todayKey();
  if (!sellerId || !/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) {
    throw new Error("badRequest");
  }

  const portfolio = getPortfolio(email);
  const seller = portfolio.owners.find((item) => item.id === sellerId);
  if (!seller) throw new Error("notFound");

  const { ids: unitIds, condominiumId } = selectSoldUnits(
    portfolio.units,
    sellerId,
    input.unitIds,
  );
  const buyer = resolveBuyer(portfolio.owners, sellerId, input.buyer);

  const issueCert = input.issueCertificate !== false;
  const settleSeller = input.settleSeller !== false;
  const doHandoff = input.handoffPortal !== false;
  const openingBalance = parseAmount(input.openingBalance);
  if (openingBalance < 0) throw new Error("invalidAmount");

  let collections = getCollections(email);
  let certificateNumber: string | null = null;
  let certificateTotal = 0;
  if (issueCert) {
    const issued = appendCertificate(collections, {
      owner: seller,
      portfolio,
      condominiumId,
      asOfDate: saleDate,
    });
    collections = issued.state;
    certificateNumber = issued.view.certificate.number;
    certificateTotal = issued.view.totalDue;
  } else {
    certificateTotal = previewDebt(
      sellerId,
      collections.quotas,
      collections.charges,
      collections.receipts,
      saleDate,
    ).total;
  }

  let settledAmount = 0;
  let receiptsIssued = 0;
  if (settleSeller) {
    const settled = settleOwnerAsOf(
      collections,
      sellerId,
      condominiumId,
      saleDate,
    );
    collections = settled.state;
    settledAmount = settled.paidAmount;
    receiptsIssued = settled.receipts;
  }

  const nextPortfolio = commitSaleTransfer(
    email,
    sellerId,
    buyer,
    unitIds,
    saleDate,
  );

  const sellerStillOwns = occupanciesForOwner(
    nextPortfolio.units,
    sellerId,
  ).some((row) => row.role === "owner");

  if (!sellerStillOwns) {
    collections = reassignOpenQuotasAfter(
      collections,
      sellerId,
      buyer.id,
      saleDate,
    );
  }

  if (openingBalance > 0) {
    collections = addChargeToState(collections, {
      id: crypto.randomUUID(),
      ownerId: buyer.id,
      condominiumId,
      date: saleDate,
      kind: "opening",
      description: "Opening balance on purchase",
      amount: openingBalance,
    });
  }

  collections = persistCollections(email, collections);

  const portal = doHandoff
    ? handoffPortal(
        email.trim().toLowerCase(),
        condominiumId,
        sellerId,
        sellerStillOwns,
        buyer,
      )
    : { portalRevoked: 0, portalInvited: false };

  return {
    portfolio: nextPortfolio,
    state: collections,
    result: {
      buyerId: buyer.id,
      sellerId,
      unitIds,
      saleDate,
      certificateNumber,
      certificateTotal,
      settledAmount,
      receiptsIssued,
      openingBalance,
      ...portal,
    },
  };
}
