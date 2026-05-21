"use client";

import React from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  action?: React.ReactNode;
}

function SectionCard({
  title,
  description,
  children,
  tone = "default",
  action,
}: SectionCardProps) {
  const borderClass =
    tone === "danger" ? "border-error-100" : "border-border-light";
  const titleClass =
    tone === "danger" ? "text-error" : "text-text-primary";

  return (
    <section
      className={`bg-surface rounded-lg shadow-card border ${borderClass} overflow-hidden`}
    >
      <header className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${titleClass}`}>{title}</h2>
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}

export default SectionCard;
