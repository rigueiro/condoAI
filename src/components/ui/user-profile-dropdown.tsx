"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import { Link } from "@/i18n/navigation";
import { User } from "@/app/types";

interface UserProfileDropdownProps {
  currentUser?: User;
  onLogout?: () => void;
}

function UserProfileDropdown({
  currentUser,
  onLogout,
}: UserProfileDropdownProps) {
  const t = useTranslations("common.profile");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = currentUser || {
    name: "John Smith",
    email: "john.smith@propertyhub.com",
    role: t("propertyManager"),
    avatar: null,
  };

  useEffect(() => {
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout?.();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center space-x-3 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-text-primary">
            {user.name}
          </div>
          <div className="text-xs text-text-secondary">{user.role}</div>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div>
                <div className="font-medium text-text-primary">{user.name}</div>
                <div className="text-sm text-text-secondary overflow-hidden truncate text-ellipsis">
                  {user.email}
                </div>
                <div className="text-xs text-accent font-medium">
                  {user.role}
                </div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              <Icon name="User" size={16} />
              <span>{t("profileSettings")}</span>
            </Link>

            <Link
              href="/account"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              <Icon name="Settings" size={16} />
              <span>{t("accountSettings")}</span>
            </Link>

            <Link
              href="/help"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
              onClick={() => setIsOpen(false)}
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
