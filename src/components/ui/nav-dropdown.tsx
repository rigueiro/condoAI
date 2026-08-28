"use client";

import { useCallback, useRef } from "react";
import Icon from "../icon";
import { Link } from "@/i18n/navigation";
import { useDismissible } from "@/hooks/use-dismissible";
import { navLinkClass, type NavLink } from "@/lib/navigation/config";

type Props = {
  label: string;
  icon: string;
  items: NavLink[];
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isActivePath: (path: string) => boolean;
};

function NavDropdown({
  label,
  icon,
  items,
  isActive,
  isOpen,
  onToggle,
  onClose,
  isActivePath,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useDismissible(rootRef, isOpen, onClose);

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-smooth xl:px-3 ${navLinkClass(isActive)}`}
      >
        <Icon name={icon} size={16} className="shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
        <Icon
          name="ChevronDown"
          size={14}
          className={`shrink-0 transition-smooth ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-1010 mt-1.5 min-w-48 animate-fade-in rounded-lg border border-border-light bg-surface py-1 shadow-modal">
          {items.map((item) => {
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-smooth ${navLinkClass(active, active ? "font-medium" : "")}`}
              >
                <Icon name={item.icon} size={16} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NavDropdown;
