"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  BUILDING_WORKSPACE_TABS,
  buildingWorkspaceHref,
  type BuildingWorkspaceTab,
} from "@/lib/portfolio";

function WorkspaceTabs({
  condominiumId,
  value,
}: {
  condominiumId: string;
  value: BuildingWorkspaceTab;
}) {
  const t = useTranslations("propertiesManagement.detail.tabs");

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-border-light">
      {BUILDING_WORKSPACE_TABS.map((tab) => (
        <Link
          key={tab}
          href={buildingWorkspaceHref(condominiumId, tab)}
          replace
          scroll={false}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-smooth ${
            value === tab
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          {t(tab)}
        </Link>
      ))}
    </div>
  );
}

export default WorkspaceTabs;
