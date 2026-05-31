"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import Image from "@/components/image";
import { Link } from "@/i18n/navigation";
import type { User } from "@/app/types";

interface UserProfileDropdownProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

function UserProfileDropdown({
  currentUser,
  onLogout,
}: UserProfileDropdownProps) {
  const t = useTranslations("common.profile");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      role: currentUser.role || t("propertyManager"),
    };
  }, [currentUser, t]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    onLogout?.();
  }, [onLogout]);

  if (!displayUser) {
    return (
      <Link
        href="/login"
        className="flex items-center space-x-2 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
        aria-label={t("signIn")}
      >
        <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-text-secondary">
          <Icon name="User" size={18} />
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {t("signIn")}
        </span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center space-x-3 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
          {displayUser.avatar ? (
            <Image
              src={displayUser.avatar}
              alt={displayUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            getInitials(displayUser.name)
          )}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-text-primary">
            {displayUser.name}
          </div>
          <div className="text-xs text-text-secondary">{displayUser.role}</div>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`transition-smooth ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bg-secondary-50 right-0 mt-2 w-64 bg-surface rounded-lg shadow-modal border border-border-light z-1010 animate-fade-in">
          <div className="p-4 border-b border-border-light">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {displayUser.avatar ? (
                  <Image
                    src={displayUser.avatar}
                    alt={displayUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getInitials(displayUser.name)
                )}
              </div>
              <div className="w-full">
                <div className="font-medium text-text-primary">
                  {displayUser.name}
                </div>
                <div className="text-sm text-text-secondary overflow-hidden truncate text-ellipsis">
                  {displayUser.email}
                </div>
                <div className="text-xs text-accent font-medium">
                  {displayUser.role}
                </div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={handleClose}
            >
              <Icon name="User" size={16} />
              <span>{t("profileSettings")}</span>
            </Link>

            <Link
              href="/account"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={handleClose}
            >
              <Icon name="Settings" size={16} />
              <span>{t("accountSettings")}</span>
            </Link>

            <Link
              href="/help"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={handleClose}
            >
              <Icon name="HelpCircle" size={16} />
              <span>{t("helpSupport")}</span>
            </Link>
          </div>

          <div className="border-t border-border-light py-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-error hover:bg-error-50 transition-smooth"
            >
              <Icon name="LogOut" size={16} />
              <span>{t("signOut")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileDropdown;
