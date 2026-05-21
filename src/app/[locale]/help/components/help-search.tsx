"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

interface HelpSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function HelpSearch({ value, onChange }: HelpSearchProps) {
  const t = useTranslations("help.search");

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon name="Search" size={20} color="var(--color-text-secondary)" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("placeholder")}
        className="w-full pl-12 pr-12 py-4 bg-surface bg-white border border-border-light rounded-xl shadow-card text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary transition-smooth"
        >
          <Icon name="X" size={18} />
        </button>
      )}
    </div>
  );
}

export default HelpSearch;
