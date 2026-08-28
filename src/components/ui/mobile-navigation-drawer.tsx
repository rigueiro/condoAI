"use client";

import { useTranslations } from "next-intl";
import Icon from "../icon";
import NavItemLink from "./nav-item-link";
import { useOverlayLock } from "@/hooks/use-overlay-lock";
import { isNavigationPathActive } from "@/lib/navigation/build-nav";
import type { NavEntry } from "@/lib/navigation/config";

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nav: NavEntry[];
  currentPath: string;
  onOpenSearch?: () => void;
}

function MobileNavigationDrawer({
  isOpen,
  onClose,
  nav,
  currentPath,
  onOpenSearch,
}: MobileNavigationDrawerProps) {
  const t = useTranslations("common");
  const tNav = useTranslations("common.nav");

  useOverlayLock(isOpen, onClose);

  if (!isOpen) return null;

  const isActivePath = (path: string) =>
    isNavigationPathActive(currentPath, path);

  return (
    <>
      <div
        className="fixed inset-0 z-1020 animate-fade-in bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed top-0 left-0 z-1020 h-full w-80 max-w-[85vw] animate-slide-in bg-surface shadow-modal lg:hidden">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border-light p-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-text-primary">
                {t("brand")}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-text-secondary transition-smooth hover:bg-secondary-50 hover:text-text-primary"
              aria-label={tNav("closeMenu")}
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {onOpenSearch && (
            <div className="border-b border-border-light px-4 py-3">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex w-full items-center gap-3 rounded-lg border border-border-light px-4 py-3 text-left text-sm text-text-secondary transition-smooth hover:border-primary-200 hover:bg-secondary-50"
              >
                <Icon name="Search" size={18} />
                <span className="flex-1">{tNav("searchPlaceholder")}</span>
                <kbd className="rounded border border-border-light bg-secondary-50 px-1.5 py-0.5 text-xs">
                  ⌘K
                </kbd>
              </button>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-4">
            {nav.map((entry) => {
              if (entry.type === "link") {
                return (
                  <div key={entry.link.path} className="px-4 pb-2">
                    <NavItemLink
                      item={entry.link}
                      active={isActivePath(entry.link.path)}
                      onClick={onClose}
                      iconSize={20}
                      className="w-full px-4 py-3 text-base"
                    />
                  </div>
                );
              }

              return (
                <div key={entry.group.id} className="mb-4 px-4">
                  <div className="mb-2 px-4 text-xs font-semibold tracking-wide text-text-secondary uppercase">
                    {entry.group.label}
                  </div>
                  <div className="space-y-1">
                    {entry.group.items.map((item) => (
                      <NavItemLink
                        key={item.path}
                        item={item}
                        active={isActivePath(item.path)}
                        onClick={onClose}
                        iconSize={20}
                        className="w-full px-4 py-3 text-base"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-border-light p-6">
            <div className="text-center text-xs text-text-secondary">
              {tNav("version")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNavigationDrawer;
