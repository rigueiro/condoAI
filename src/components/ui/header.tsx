"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import UserProfileDropdown from "./user-profile-dropdown";
import MobileNavigationDrawer from "./mobile-navigation-drawer";
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
        tooltip: t("nav.dashboardTooltip"),
      },
      {
        label: t("nav.properties"),
        path: "/properties-management",
        icon: "Building2",
        tooltip: t("nav.propertiesTooltip"),
      },
      {
        label: t("nav.owners"),
        path: "/owners-management",
        icon: "Users",
        tooltip: t("nav.ownersTooltip"),
      },
      {
        label: t("nav.payments"),
        path: "/payment-tracking",
        icon: "CreditCard",
        tooltip: t("nav.paymentsTooltip"),
      },
      {
        label: t("nav.finance"),
        path: "/finance",
        icon: "Wallet",
        tooltip: t("nav.financeTooltip"),
      },
      {
        label: t("nav.occurrences"),
        path: "/occurrences",
        icon: "ClipboardList",
        tooltip: t("nav.occurrencesTooltip"),
      },
      {
        label: t("nav.compliance"),
        path: "/compliance",
        icon: "ScrollText",
        tooltip: t("nav.complianceTooltip"),
      },
      {
        label: t("nav.reports"),
        path: "/reports-analytics",
        icon: "BarChart3",
        tooltip: t("nav.reportsTooltip"),
      },
    ],
    [t],
  );

  const isActivePath = useCallback(
    (path: string) => pathname === path,
    [pathname],
  );

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
      <header className="fixed top-0 left-0 right-0 bg-surface bg-secondary-50 border-b border-border-light z-1000">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 transition-smooth hover:opacity-80"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Building2" size={20} color="white" />
                </div>
                <span className="text-xl font-semibold text-text-primary">
                  {t("brand")}
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    isActivePath(item.path)
                      ? "bg-primary-50 text-primary border border-primary-100"
                      : "text-text-secondary hover:text-text-primary hover:bg-secondary-50"
                  }`}
                  title={item.tooltip}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <UserProfileDropdown
                currentUser={user}
                onLogout={handleLogout}
              />

              <button
                onClick={handleMobileMenuToggle}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
                aria-label={t("nav.toggleMobileMenu")}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>
        </div>
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
