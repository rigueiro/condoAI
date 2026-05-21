"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

export type HelpCategoryId =
  | "gettingStarted"
  | "properties"
  | "owners"
  | "payments"
  | "reports"
  | "account";

export interface HelpCategory {
  id: HelpCategoryId;
  icon: string;
  articleCount: number;
  accent: "primary" | "accent" | "success" | "warning" | "secondary" | "error";
}

interface HelpCategoriesProps {
  categories: HelpCategory[];
  onSelect?: (category: HelpCategory) => void;
}

const ACCENT_STYLES: Record<HelpCategory["accent"], string> = {
  primary: "bg-primary-50 text-primary",
  accent: "bg-accent-50 text-accent",
  success: "bg-success-50 text-success",
  warning: "bg-warning-50 text-warning",
  secondary: "bg-secondary-100 text-text-secondary",
  error: "bg-error-50 text-error",
};

function HelpCategories({ categories, onSelect }: HelpCategoriesProps) {
  const t = useTranslations("help.categories");
  const tItems = useTranslations("help.categories.items");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect?.(category)}
          className="group text-left p-5 rounded-lg border border-border-light bg-surface hover:border-primary hover:shadow-card transition-smooth"
        >
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${ACCENT_STYLES[category.accent]}`}
          >
            <Icon name={category.icon} size={22} />
          </div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-smooth">
            {tItems(`${category.id}.title`)}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {tItems(`${category.id}.description`)}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
            <span>{t("articleCount", { count: category.articleCount })}</span>
            <Icon
              name="ArrowRight"
              size={14}
              className="group-hover:text-primary transition-smooth"
            />
          </div>
        </button>
      ))}
    </div>
  );
}

export default HelpCategories;
