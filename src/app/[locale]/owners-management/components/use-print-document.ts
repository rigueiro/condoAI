"use client";

import { useCallback, useEffect } from "react";

const PRINT_CLASS = "print-document";

export function usePrintDocument(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const clear = () => document.body.classList.remove(PRINT_CLASS);
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, [active]);

  return useCallback(() => {
    document.body.classList.add(PRINT_CLASS);
    window.print();
  }, []);
}
