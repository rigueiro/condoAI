import { NextResponse } from "next/server";
import { AuthRequiredError } from "./session";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function jsonError(
  code: string,
  status = 400,
): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

const ERROR_STATUS: Record<string, number> = {
  invalidCredentials: 401,
  unauthorized: 401,
  notAuthenticated: 401,
  forbidden: 403,
  emailAlreadyRegistered: 409,
  membershipExists: 409,
  unitHasOwners: 409,
  duplicateLabel: 409,
  notFound: 404,
  condominiumNotFound: 404,
  unitNotFound: 404,
  invalidAmount: 400,
  alreadyIssued: 409,
  noApprovedBudget: 400,
  noBilledOwners: 400,
  extractUnavailable: 400,
  assemblyClosed: 409,
  assemblyLocked: 409,
  agendaRequired: 400,
  summonsRequired: 400,
  noticeTooShort: 400,
  proofRequired: 400,
  notInSession: 409,
  quorumRequired: 409,
  minutesRequired: 400,
  vendorInUse: 409,
  teamMemberExists: 409,
  cannotInviteSelf: 400,
  noRecipients: 400,
  unitsRequired: 400,
  sameOwner: 400,
  notOwnerOfUnit: 400,
  buyerRequired: 400,
  multipleCondominiums: 400,
  alreadyActive: 409,
  noDebt: 400,
  invalidInstallments: 400,
  invalidMoraRate: 400,
  invalidDate: 400,
  agreementNotFound: 404,
  installmentNotFound: 404,
  installmentPaid: 409,
  installmentOutOfOrder: 409,
  hasPayments: 409,
  notActive: 409,
  projectNotFound: 404,
  quoteNotFound: 404,
  interventionNotFound: 404,
  assemblyNotFound: 404,
  noQuotes: 400,
  resolutionRequired: 400,
  resolutionRejected: 409,
  alreadyAwarded: 409,
  alreadyComplete: 409,
  alreadyCancelled: 409,
  hasQuota: 409,
  hasWorkLog: 409,
  workLogRequired: 400,
  vendorRequiredForLog: 400,
};

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof AuthRequiredError) {
    return jsonError("unauthorized", 401);
  }
  if (err instanceof Error) {
    return jsonError(err.message, ERROR_STATUS[err.message] ?? 400);
  }
  return jsonError("serverError", 500);
}
