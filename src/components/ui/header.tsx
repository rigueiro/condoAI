"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import UserProfileDropdown from "./user-profile-dropdown";
import MobileNavigationDrawer from "./mobile-navigation-drawer";
import CondominiumSwitcher from "./condominium-switcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";

function Header() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = useMemo(
    () => [
      {
        label: t("nav.dashboard"),
        path: "/dashboard",
        icon: "LayoutDashboard",
      },
      {
        label: t("nav.properties"),
        path: "/properties-management",
        icon: "Building2",
      },
      {
        label: t("nav.owners"),
        path: "/owners-management",
        icon: "Users",
      },
      {
        label: t("nav.payments"),
        path: "/payment-tracking",
        icon: "CreditCard",
      },
      {
        label: t("nav.finance"),
        path: "/finance",
        icon: "Wallet",
      },
      {
        label: t("nav.occurrences"),
        path: "/occurrences",
        icon: "ClipboardList",
      },
      {
        label: t("nav.compliance"),
        path: "/compliance",
        icon: "ScrollText",
      },
      {
        label: t("nav.reports"),
        path: "/reports-analytics",
        icon: "BarChart3",
      },
    ],
    [t],
  );

  const isActivePath = useCallback((path: string) => {
    if (pathname === path) return true;
    return path !== "/dashboard" && pathname.startsWith(`${path}/`);
  }, [pathname]);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }, [logout, router]);

  return (
    <>
      <header className="sticky top-0 z-1000 border-b border-border-light bg-surface bg-secondary-50">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 transition-smooth hover:opacity-80 sm:gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" size={20} color="white" />
              </div>
              <span className="truncate text-lg font-semibold text-text-primary sm:text-xl">
                {t("brand")}
              </span>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
              {navigationItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-smooth xl:px-2.5 ${
                      active
                        ? "border border-primary-100 bg-primary-50 text-primary"
                        : "text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
                    }`}
                  >
                    <Icon name={item.icon} size={16} className="shrink-0" />
                    <span className="hidden whitespace-nowrap xl:inline">
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 rounded-md bg-text-primary px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 xl:hidden"
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <UserProfileDropdown
                currentUser={user}
                onLogout={handleLogout}
              />

              <button
                type="button"
                onClick={handleMobileMenuToggle}
                className="rounded-lg p-2 text-text-secondary transition-smooth hover:bg-secondary-50 hover:text-text-primary lg:hidden"
                aria-label={t("nav.toggleMobileMenu")}
                aria-expanded={isMobileMenuOpen}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>
        </div>
        <CondominiumSwitcher />
      </header>

      <MobileNavigationDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        navigationItems={navigationItems}
        currentPath={pathname}
      />
    </>
  );
}

export default Header;
