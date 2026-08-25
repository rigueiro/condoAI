"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Select from "@/components/ui/select";
import Icon from "@/components/icon";
import {
  buildingWorkspaceHref,
  useActiveCondominium,
  usePortfolio,
} from "@/lib/portfolio";

function currentWorkspaceTab(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("tab");
}

function CondominiumSwitcher() {
  const t = useTranslations("common.switcher");
  const { portfolio } = usePortfolio();
  const { activeId } = useActiveCondominium();
  const router = useRouter();
  const condominiums = portfolio.condominiums;

  const onChange = useCallback(
    (nextId: string | null) => {
      if (!nextId) {
        if (activeId) router.push("/properties-management");
        return;
      }
      if (activeId === nextId) return;
      router.push(
        buildingWorkspaceHref(
          nextId,
          activeId ? currentWorkspaceTab() : null,
        ),
      );
    },
    [activeId, router],
  );

  if (condominiums.length === 0) return null;

  return (
    <div className="border-t border-border-light bg-surface px-4 py-2 sm:px-6">
      <div className="flex items-center gap-3">
        <Icon name="Building2" size={16} className="shrink-0 text-text-secondary" />
        <span className="hidden shrink-0 text-sm font-medium text-text-secondary sm:inline">
          {t("label")}
        </span>
        <Select
          aria-label={t("label")}
          selectSize="sm"
          value={activeId ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          containerClassName="min-w-0 w-full max-w-md"
          className="truncate"
        >
          <option value="">{t("all")}</option>
          {condominiums.map((condo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default CondominiumSwitcher;
