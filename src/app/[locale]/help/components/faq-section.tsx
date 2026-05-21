"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

interface FaqSectionProps {
  items: { id: string }[];
}

function FaqSection({ items }: FaqSectionProps) {
  const t = useTranslations("help.faq.items");
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="divide-y divide-border-light">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="py-2">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-text-primary">
                {t(`${item.id}.question`)}
              </span>
              <Icon
                name="ChevronDown"
                size={18}
                className={`flex-shrink-0 text-text-secondary transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="pb-4 pr-8 text-sm text-text-secondary leading-relaxed">
                {t(`${item.id}.answer`)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FaqSection;
