"use client";

import { useCallback, useMemo } from "react";
import { useOperations } from "./operations-provider";
import { resolveVendorLabel, vendorNameById } from "./views";

export function useVendorNames() {
  const { vendors } = useOperations();
  return useMemo(() => vendorNameById(vendors), [vendors]);
}

/** Resolve vendorId → name with optional legacy free-text fallback. */
export function useResolveVendorLabel() {
  const names = useVendorNames();
  return useCallback(
    (vendorId: string | null | undefined, fallback?: string | null) =>
      resolveVendorLabel(vendorId, names, fallback),
    [names],
  );
}
