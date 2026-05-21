"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

export type HelpResourceId =
  | "docs"
  | "videos"
  | "changelog"
  | "status"
  | "community"
  | "roadmap";

export interface HelpResource {
  id: HelpResourceId;
  icon: string;
  href: string;
}

interface ResourcesSectionProps {
  resources: HelpResource[];
}

function ResourcesSection({ resources }: ResourcesSectionProps) {
  const t = useTranslations("help.resources");
  const tItems = useTranslations("help.resources.items");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-3 p-4 rounded-lg border border-border-light hover:border-primary hover:shadow-card transition-smooth"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-secondary-50 text-text-secondary group-hover:bg-primary-50 group-hover:text-primary flex items-center justify-center flex-shrink-0 transition-smooth">
              <Icon name={resource.icon} size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-text-primary truncate">
                {tItems(`${resource.id}.title`)}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5 truncate">
                {tItems(`${resource.id}.description`)}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-text-secondary group-hover:text-primary transition-smooth flex-shrink-0">
            <span className="sr-only sm:not-sr-only">{t("open")}</span>
            <Icon name="ExternalLink" size={14} />
          </span>
        </a>
      ))}
    </div>
  );
}

export default ResourcesSection;
