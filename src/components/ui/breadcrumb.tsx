"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import { Link, usePathname } from "@/i18n/navigation";

function Breadcrumb() {
  const t = useTranslations("common.breadcrumb");
  const currentPath = usePathname();

  const routeConfig = {
    "/dashboard": { labelKey: "dashboard" as const, parent: null },
    "/properties-management": {
      labelKey: "properties" as const,
      parent: "/dashboard",
    },
    "/owners-management": { labelKey: "owners" as const, parent: "/dashboard" },
    "/payment-tracking": { labelKey: "payments" as const, parent: "/dashboard" },
    "/reports-analytics": { labelKey: "reports" as const, parent: "/dashboard" },
    "/profile": { labelKey: "profile" as const, parent: "/dashboard" },
    "/account": { labelKey: "account" as const, parent: "/dashboard" },
    "/help": { labelKey: "help" as const, parent: "/dashboard" },
  };

  const buildBreadcrumbs = (path: string) => {
    if (
      path.startsWith("/properties-management/") &&
      path !== "/properties-management"
    ) {
      return [
        {
          label: t("properties"),
          path: "/properties-management",
          isActive: false,
        },
        { label: t("propertyDetail"), path, isActive: true },
      ];
    }

    const breadcrumbs: { label: string; path: string; isActive: boolean }[] =
      [];
    let currentRoute = routeConfig[path as keyof typeof routeConfig];
    let pathCursor = path;

    while (currentRoute) {
      breadcrumbs.unshift({
        label: t(currentRoute.labelKey),
        path: pathCursor,
        isActive: pathCursor === path,
      });

      if (currentRoute.parent) {
        pathCursor = currentRoute.parent;
        currentRoute = routeConfig[pathCursor as keyof typeof routeConfig];
      } else {
        break;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs(currentPath);

  if (breadcrumbs.length <= 1 || currentPath === "/login") {
    return null;
  }

  return (
    <nav
      className="flex items-center space-x-2 text-sm text-text-secondary mb-6"
      aria-label={t("ariaLabel")}
    >
      <Icon name="Home" size={16} className="text-text-secondary" />

      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && (
            <Icon
              name="ChevronRight"
              size={14}
              className="text-secondary-300"
            />
          )}

          {breadcrumb.isActive ? (
            <span className="font-medium text-text-primary" aria-current="page">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              href={breadcrumb.path}
              className="hover:text-text-primary transition-smooth"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;
