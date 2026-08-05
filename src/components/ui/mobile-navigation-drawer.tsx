"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Icon from "../icon";

type NavigationItem = {
  label: string;
  path: string;
  icon: string;
  tooltip?: string;
};

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  currentPath: string;
}

function MobileNavigationDrawer({
  isOpen,
  onClose,
  navigationItems,
  currentPath,
}: MobileNavigationDrawerProps) {
  const t = useTranslations("common");

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const isActivePath = (path: string) => currentPath === path;

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-1020 md:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed top-0 left-0 h-full w-80 bg-surface shadow-modal z-1020 md:hidden animate-slide-in">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border-light">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Building2" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-text-primary">
                {t("brand")}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              aria-label={t("nav.closeMenu")}
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <nav className="flex-1 py-6">
            <div className="space-y-2 px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-smooth ${
                    isActivePath(item.path)
                      ? "bg-primary-50 text-primary border border-primary-100"
                      : "text-text-secondary hover:text-text-primary hover:bg-secondary-50"
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="p-6 border-t border-border-light">
            <div className="text-xs text-text-secondary text-center">
              {t("nav.version")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNavigationDrawer;
