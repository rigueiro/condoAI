"use client";

import { useEffect } from "react";

export function useOverlayLock(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape?.();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [active, onEscape]);
}
