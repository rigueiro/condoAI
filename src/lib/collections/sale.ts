import { roundCurrency } from "@/lib/quota";
import type { CollectionsState, PaymentDetails } from "./types";
import {
  accountBalance,
  addChargeToState,
  issueReceipt,
  quotaDueDate,
} from "./ledger";
import { markQuotaPaid } from "./storage";

const SETTLEMENT_NOTES = "Sale settlement";

/** Pay seller quotas due on or before the sale date; credit any leftover. */
export function settleOwnerAsOf(
  state: CollectionsState,
  ownerId: string,
  condominiumId: string,
  saleDate: string,
): { state: CollectionsState; paidAmount: number; receipts: number } {
  const open = state.quotas.filter(
    (quota) =>
      quota.ownerId === ownerId &&
      (quota.status === "pending" || quota.status === "overdue") &&
      quotaDueDate(quota.monthYear) <= saleDate,
  );

  let next = state;
  let paidAmount = 0;
  let receipts = 0;

  for (const quota of open) {
    const issued = issueReceipt(next, {
      ownerId,
      condominiumId,
      date: saleDate,
      amount: quota.amount,
      paymentMethod: "Bank Transfer",
      notes: SETTLEMENT_NOTES,
      quotaId: quota.id,
    });
    const details: PaymentDetails = {
      paymentMethod: issued.receipt.paymentMethod,
      receiptNumber: issued.receipt.number,
      notes: SETTLEMENT_NOTES,
      timestamp: new Date().toISOString(),
    };
    next = markQuotaPaid(issued.state, quota.id, saleDate, details);
    paidAmount += quota.amount;
    receipts += 1;
  }

  const leftover = accountBalance(
    ownerId,
    next.quotas,
    next.charges,
    next.receipts,
    saleDate,
  );
  if (leftover > 0) {
    next = addChargeToState(next, {
      id: crypto.randomUUID(),
      ownerId,
      condominiumId,
      date: saleDate,
      kind: "credit",
      description: SETTLEMENT_NOTES,
      amount: leftover,
    });
    paidAmount += leftover;
  }

  return { state: next, paidAmount: roundCurrency(paidAmount), receipts };
}

/** Move unpaid quotas due after the sale to the buyer (full-exit only). */
export function reassignOpenQuotasAfter(
  state: CollectionsState,
  fromOwnerId: string,
  toOwnerId: string,
  saleDate: string,
): CollectionsState {
  return {
    ...state,
    quotas: state.quotas.map((quota) => {
      if (quota.ownerId !== fromOwnerId) return quota;
      if (quota.status === "paid") return quota;
      if (quotaDueDate(quota.monthYear) <= saleDate) return quota;
      return { ...quota, ownerId: toOwnerId };
    }),
  };
}
