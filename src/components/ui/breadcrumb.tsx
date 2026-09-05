"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "../icon";
import { Link, usePathname } from "@/i18n/navigation";
import { usePortfolio } from "@/lib/portfolio";

function Breadcrumb() {
  const t = useTranslations("common.breadcrumb");
  const currentPath = usePathname();
  const { portfolio } = usePortfolio();

  const routeConfig = {
    "/dashboard": { labelKey: "dashboard" as const, parent: null },
    "/properties-management": {
      labelKey: "properties" as const,
      parent: "/dashboard",
    },
    "/owners-management": { labelKey: "owners" as const, parent: "/dashboard" },
    "/payment-tracking": { labelKey: "payments" as const, parent: "/dashboard" },
    "/finance": { labelKey: "finance" as const, parent: "/dashboard" },
    "/assemblies": { labelKey: "assemblies" as const, parent: "/dashboard" },
    "/occurrences": { labelKey: "occurrences" as const, parent: "/dashboard" },
    "/compliance": { labelKey: "compliance" as const, parent: "/dashboard" },
    "/operations": { labelKey: "operations" as const, parent: "/dashboard" },
    "/works": { labelKey: "works" as const, parent: "/dashboard" },
    "/documents": {
      labelKey: "documentsArchive" as const,
      parent: "/dashboard",
    },
    "/announcements": {
      labelKey: "announcements" as const,
      parent: "/dashboard",
    },
    "/reports-analytics": { labelKey: "reports" as const, parent: "/dashboard" },
    "/portal": { labelKey: "portal" as const, parent: null },
    "/portal/extract": { labelKey: "extract" as const, parent: "/portal" },
    "/portal/documents": { labelKey: "documents" as const, parent: "/portal" },
    "/portal/occurrences": {
      labelKey: "occurrences" as const,
      parent: "/portal",
    },
    "/portal/announcements": {
      labelKey: "announcements" as const,
      parent: "/portal",
    },
    "/portal/budget": { labelKey: "budget" as const, parent: "/portal" },
    "/profile": { labelKey: "profile" as const, parent: "/dashboard" },
    "/account": { labelKey: "account" as const, parent: "/dashboard" },
    "/help": { labelKey: "help" as const, parent: "/dashboard" },
  };

  const buildBreadcrumbs = (path: string) => {
    if (
      path.startsWith("/properties-management/") &&
      path !== "/properties-management"
    ) {
      const condoId = path.slice("/properties-management/".length).split("/")[0];
      const condoName =
        portfolio.condominiums.find((condo) => condo.id === condoId)?.name ??
        t("propertyDetail");
      return [
        {
          label: t("properties"),
          path: "/properties-management",
          isActive: false,
        },
        { label: condoName, path, isActive: true },
      ];
    }

    if (
      path.startsWith("/owners-management/") &&
      path !== "/owners-management"
    ) {
      return [
        {
          label: t("owners"),
          path: "/owners-management",
          isActive: false,
        },
        { label: t("ownerDetail"), path, isActive: true },
      ];
    }

    if (path.startsWith("/occurrences/") && path !== "/occurrences") {
      return [
        {
          label: t("occurrences"),
          path: "/occurrences",
          isActive: false,
        },
        { label: t("occurrenceDetail"), path, isActive: true },
      ];
    }

    if (path.startsWith("/works/") && path !== "/works") {
      return [
        {
          label: t("works"),
          path: "/works",
          isActive: false,
        },
        { label: t("workDetail"), path, isActive: true },
      ];
    }

    if (path.startsWith("/assemblies/") && path !== "/assemblies") {
      return [
        {
          label: t("assemblies"),
          path: "/assemblies",
          isActive: false,
        },
        { label: t("assemblyDetail"), path, isActive: true },
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
