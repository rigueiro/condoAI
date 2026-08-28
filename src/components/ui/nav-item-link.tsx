"use client";

import Icon from "../icon";
import { Link } from "@/i18n/navigation";
import { navLinkClass, type NavLink } from "@/lib/navigation/config";

type Props = {
  item: NavLink;
  active: boolean;
  onClick?: () => void;
  iconSize?: number;
  className?: string;
  labelClassName?: string;
  tooltip?: string;
};

function NavItemLink({
  item,
  active,
  onClick,
  iconSize = 16,
  className = "",
  labelClassName = "whitespace-nowrap",
  tooltip,
}: Props) {
  return (
    <Link
      href={item.path}
      onClick={onClick}
      aria-label={tooltip ?? item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-smooth ${navLinkClass(active, className)}`}
    >
      <Icon name={item.icon} size={iconSize} className="shrink-0" />
      <span className={labelClassName}>{item.label}</span>
      {tooltip && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 rounded-md bg-text-primary px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 xl:hidden"
        >
          {tooltip}
        </span>
      )}
    </Link>
  );
}

export default NavItemLink;
