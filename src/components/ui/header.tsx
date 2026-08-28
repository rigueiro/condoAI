"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import UserProfileDropdown from "./user-profile-dropdown";
import MobileNavigationDrawer from "./mobile-navigation-drawer";
import CondominiumSwitcher from "./condominium-switcher";
import DesktopNav from "./desktop-nav";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { useMemberships } from "@/lib/memberships";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useCommandPalette } from "@/hooks/use-command-palette";

const CommandPalette = dynamic(() => import("./command-palette"), {
  ssr: false,
});

function Header() {
  const t = useTranslations("common");
  const tNav = useTranslations("common.nav");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, isReady, teamRole } = useMemberships();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const commandPalette = useCommandPalette();

  const isPortal = isReady && mode === "portal";
  const { nav, commandItems } = useAppNavigation(isPortal, teamRole);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }, [logout, router]);

  const openSearch = useCallback(() => {
    setOpenDropdownId(null);
    commandPalette.open();
  }, [commandPalette]);

  return (
    <>
      <header className="sticky top-0 z-1000 border-b border-border-light bg-surface bg-secondary-50">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link
              href={isPortal ? "/portal" : "/dashboard"}
              className="flex shrink-0 items-center gap-2 transition-smooth hover:opacity-80 sm:gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" size={20} color="white" />
              </div>
              <span className="truncate text-lg font-semibold text-text-primary sm:text-xl">
                {t("brand")}
              </span>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              <DesktopNav
                nav={nav}
                isPortal={isPortal}
                pathname={pathname}
                openDropdownId={openDropdownId}
                onToggleDropdown={(id) =>
                  setOpenDropdownId((current) => (current === id ? null : id))
                }
                onCloseDropdown={() => setOpenDropdownId(null)}
              />
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={openSearch}
                className="hidden items-center gap-2 rounded-lg border border-border-light bg-surface px-2.5 py-1.5 text-sm text-text-secondary transition-smooth hover:border-primary-200 hover:text-text-primary sm:flex lg:px-3"
                aria-label={tNav("searchHint")}
              >
                <Icon name="Search" size={16} className="shrink-0" />
                <span className="hidden xl:inline">{tNav("search")}</span>
                <kbd className="hidden rounded border border-border-light bg-secondary-50 px-1.5 py-0.5 text-xs 2xl:inline">
                  ⌘K
                </kbd>
              </button>

              <UserProfileDropdown
                currentUser={user}
                onLogout={handleLogout}
              />

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="rounded-lg p-2 text-text-secondary transition-smooth hover:bg-secondary-50 hover:text-text-primary lg:hidden"
                aria-label={tNav("toggleMobileMenu")}
                aria-expanded={isMobileMenuOpen}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>
        </div>
        {!isPortal && <CondominiumSwitcher />}
      </header>

      <MobileNavigationDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        nav={nav}
        currentPath={pathname}
        onOpenSearch={() => {
          setIsMobileMenuOpen(false);
          commandPalette.open();
        }}
      />

      {commandPalette.isOpen && (
        <CommandPalette
          onClose={commandPalette.close}
          items={commandItems}
        />
      )}
    </>
  );
}

export default Header;
