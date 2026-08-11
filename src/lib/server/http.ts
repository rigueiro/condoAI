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

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof AuthRequiredError) {
    return jsonError("unauthorized", 401);
  }
  if (err instanceof Error) {
    const status =
      err.message === "invalidCredentials" ||
      err.message === "unauthorized" ||
      err.message === "notAuthenticated"
        ? 401
        : err.message === "emailAlreadyRegistered"
          ? 409
          : 400;
    return jsonError(err.message, status);
  }
  return jsonError("serverError", 500);
}
