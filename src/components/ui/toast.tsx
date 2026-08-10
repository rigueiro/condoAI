"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/icon";

export type ToastTone = "success" | "warning";

type ToastProps = {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
  onDismiss: () => void;
};

/**
 * Viewport-fixed action feedback so results stay visible without scrolling.
 */
function Toast({
  message,
  tone = "success",
  durationMs = 4000,
  onDismiss,
}: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!mounted) return null;

  const isWarning = tone === "warning";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:p-6"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-lg border px-4 py-3 shadow-card ${
          isWarning
            ? "border-warning-100 bg-warning-50"
            : "border-success-100 bg-success-50"
        }`}
      >
        <Icon
          name={isWarning ? "AlertTriangle" : "CheckCircle2"}
          size={16}
          color={
            isWarning ? "var(--color-warning)" : "var(--color-success)"
          }
          className="mt-0.5 shrink-0"
        />
        <p
          className={`min-w-0 flex-1 text-sm ${
            isWarning ? "text-warning" : "text-success"
          }`}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className={`-mr-1 -mt-0.5 shrink-0 rounded p-1 transition-smooth ${
            isWarning
              ? "text-warning hover:bg-warning-100"
              : "text-success hover:bg-success-100"
          }`}
          aria-label="Dismiss"
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default Toast;
