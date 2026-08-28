"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import { useRouter } from "@/i18n/navigation";
import { useOverlayLock } from "@/hooks/use-overlay-lock";
import type { CommandPaletteItem } from "@/lib/navigation/config";

type Props = {
  onClose: () => void;
  items: CommandPaletteItem[];
};

function CommandPalette({ onClose, items }: Props) {
  const t = useTranslations("common.nav");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  useOverlayLock(true, onClose);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.keywords?.toLowerCase().includes(normalized));
  }, [items, query]);

  useEffect(() => {
    setQuery("");
    setHighlightIndex(0);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex(
        (index) => (index - 1 + filtered.length) % filtered.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = filtered[highlightIndex];
      if (target) navigateTo(target.path);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-1030 animate-fade-in bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("searchHint")}
        className="fixed top-[15vh] left-1/2 z-1030 w-full max-w-lg -translate-x-1/2 animate-fade-in px-4"
      >
        <div className="overflow-hidden rounded-xl border border-border-light bg-surface shadow-modal">
          <div className="flex items-center gap-3 border-b border-border-light px-4 py-3">
            <Icon
              name="Search"
              size={18}
              className="shrink-0 text-text-secondary"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
            <kbd className="hidden rounded border border-border-light bg-secondary-50 px-1.5 py-0.5 text-xs text-text-secondary sm:inline">
              esc
            </kbd>
          </div>

          <ul className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-secondary">
                {t("noResults")}
              </li>
            ) : (
              filtered.map((item, index) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => navigateTo(item.path)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-smooth ${
                      index === highlightIndex
                        ? "bg-primary-50 text-primary"
                        : "text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
                    }`}
                  >
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-text-primary">
                        {item.label}
                      </span>
                      {item.groupLabel && (
                        <span className="block truncate text-xs text-text-secondary">
                          {item.groupLabel}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default CommandPalette;
