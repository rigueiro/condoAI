"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api/client";
import { useMemberships, type PortalMembershipView } from "@/lib/memberships";

/** Keeps portal condo selection in the `condo` query param. */
export function usePortalCondo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { portalMemberships } = useMemberships();
  const fromQuery = searchParams.get("condo") ?? "";

  const selected: PortalMembershipView | undefined =
    portalMemberships.find((m) => m.condominiumId === fromQuery) ??
    portalMemberships[0];

  const condominiumId = selected?.condominiumId ?? "";

  const setCondominiumId = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("condo", id);
      else params.delete("condo");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!selected || fromQuery === selected.condominiumId) return;
    setCondominiumId(selected.condominiumId);
  }, [fromQuery, selected, setCondominiumId]);

  return { condominiumId, setCondominiumId, selected };
}

export function usePortalFetch<T>(path: string | null): {
  data: T | null;
  error: string | null;
  loading: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));

  useEffect(() => {
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const next = await apiFetch<T>(path);
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "requestFailed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, error, loading };
}
