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
  noRecipients: 400,
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
