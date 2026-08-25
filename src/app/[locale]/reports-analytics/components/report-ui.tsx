"use client";

import type { ReactNode } from "react";

export function ReportStat({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border-light bg-surface px-4 py-3 ${className}`}
    >
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-primary">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

export function ReportEmpty({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <p
      className={`rounded-lg border border-border-light bg-surface text-center text-sm text-text-secondary ${
        compact ? "px-4 py-6" : "px-6 py-10"
      }`}
    >
      {children}
    </p>
  );
}

export function ReportTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-light bg-surface">
      {children}
    </div>
  );
}
