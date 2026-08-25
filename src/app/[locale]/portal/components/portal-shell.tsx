"use client";

import { type ReactNode, useMemo } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Select from "@/components/ui/select";
import { Link, usePathname } from "@/i18n/navigation";
import {
  canPortal,
  roleDisplayKey,
  useMemberships,
} from "@/lib/memberships";
import { usePortalCondo } from "./use-portal-condo";

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

function PortalShell({ children, title, subtitle }: Props) {
  const t = useTranslations("portal");
  const tRoles = useTranslations("portal.roles");
  const pathname = usePathname();
  const { portalMemberships } = useMemberships();
  const { selected, setCondominiumId } = usePortalCondo();

  const condoQs = selected ? `?condo=${selected.condominiumId}` : "";

  const nav = useMemo(() => {
    const role = selected?.role;
    const items = [
      { href: "/portal", label: t("nav.home"), match: pathname === "/portal" },
    ];
    if (role && canPortal(role, "readExtract") && selected?.ownerId) {
      items.push({
        href: `/portal/extract${condoQs}`,
        label: t("nav.extract"),
        match: pathname.startsWith("/portal/extract"),
      });
    }
    if (role && canPortal(role, "readDocuments")) {
      items.push({
        href: `/portal/documents${condoQs}`,
        label: t("nav.documents"),
        match: pathname.startsWith("/portal/documents"),
      });
    }
    if (role && canPortal(role, "readOccurrences")) {
      items.push({
        href: `/portal/occurrences${condoQs}`,
        label: t("nav.occurrences"),
        match: pathname.startsWith("/portal/occurrences"),
      });
    }
    if (role && canPortal(role, "readAnnouncements")) {
      items.push({
        href: `/portal/announcements${condoQs}`,
        label: t("nav.announcements"),
        match: pathname.startsWith("/portal/announcements"),
      });
    }
    if (role && canPortal(role, "readBudget")) {
      items.push({
        href: `/portal/budget${condoQs}`,
        label: t("nav.budget"),
        match: pathname.startsWith("/portal/budget"),
      });
    }
    return items;
  }, [condoQs, pathname, selected, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Breadcrumb />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
            )}
            {selected && (
              <p className="mt-2 text-sm text-text-secondary">
                {selected.condominiumName}
                {" · "}
                {tRoles(roleDisplayKey(selected.role))}
              </p>
            )}
          </div>
          {portalMemberships.length > 1 && (
            <label className="block text-sm sm:w-64">
              <span className="mb-1 block text-text-secondary">
                {t("condoPicker")}
              </span>
              <Select
                value={selected?.condominiumId ?? ""}
                onChange={(e) => setCondominiumId(e.target.value)}
              >
                {portalMemberships.map((m) => (
                  <option key={m.id} value={m.condominiumId}>
                    {m.condominiumName}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>

        <nav className="mb-6 flex flex-wrap gap-1 border-b border-border-light">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-smooth ${
                item.match
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {portalMemberships.length === 0 ? (
          <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
            {t("noAccess")}
          </p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export default PortalShell;
