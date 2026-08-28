"use client";

import NavDropdown from "./nav-dropdown";
import NavItemLink from "./nav-item-link";
import {
  isGroupActive,
  isNavigationPathActive,
} from "@/lib/navigation/build-nav";
import type { NavEntry } from "@/lib/navigation/config";

type Props = {
  nav: NavEntry[];
  isPortal: boolean;
  pathname: string;
  openDropdownId: string | null;
  onToggleDropdown: (id: string) => void;
  onCloseDropdown: () => void;
};

function DesktopNav({
  nav,
  isPortal,
  pathname,
  openDropdownId,
  onToggleDropdown,
  onCloseDropdown,
}: Props) {
  const isActivePath = (path: string) =>
    isNavigationPathActive(pathname, path);

  return nav.map((entry) => {
    if (entry.type === "link") {
      const { link } = entry;
      return (
        <NavItemLink
          key={link.path}
          item={link}
          active={isActivePath(link.path)}
          className={isPortal ? "xl:px-2.5" : "xl:px-3"}
          labelClassName={
            isPortal ? "hidden whitespace-nowrap xl:inline" : "whitespace-nowrap"
          }
          tooltip={isPortal ? link.label : undefined}
        />
      );
    }

    return (
      <NavDropdown
        key={entry.group.id}
        label={entry.group.label}
        icon={entry.group.icon}
        items={entry.group.items}
        isActive={isGroupActive(pathname, entry.group.items)}
        isOpen={openDropdownId === entry.group.id}
        onToggle={() => onToggleDropdown(entry.group.id)}
        onClose={onCloseDropdown}
        isActivePath={isActivePath}
      />
    );
  });
}

export default DesktopNav;
