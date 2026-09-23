import type { NextResponse } from "next/server";
import { handleRouteError } from "./http";
import { withPlaygroundStore } from "./playground-store";

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Loads the per-session playground store (when PLAYGROUND=1) before the
 * handler runs, and flushes it before the response is returned.
 */
export function apiRoute<C = RouteContext>(
  handler: (request: Request, context: C) => Promise<NextResponse>,
) {
  return async (request: Request, context: C) => {
    try {
      return await withPlaygroundStore(request, () =>
        handler(request, context),
      );
    } catch (err) {
      return handleRouteError(err);
    }
  };
}
