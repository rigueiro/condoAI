"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { usePlayground } from "@/lib/playground";

function PlaygroundBanner() {
  const enabled = usePlayground();
  const { isAuthenticated, resetPlayground } = useAuth();
  const t = useTranslations("common.playground");
  const [busy, setBusy] = useState(false);

  if (!enabled || !isAuthenticated) return null;

  const handleReset = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await resetPlayground();
      window.location.reload();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-accent-50 px-4 py-2 text-sm text-accent">
      <p className="text-center">{t("banner")}</p>
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={busy}
        className="shrink-0 rounded-md border border-accent bg-surface px-2 py-0.5 text-xs font-medium text-accent transition-smooth hover:bg-accent-100 disabled:opacity-60"
      >
        {busy ? t("resetting") : t("reset")}
      </button>
    </div>
  );
}

export default PlaygroundBanner;
