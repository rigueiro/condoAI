"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  buildNavigation,
  flattenForCommandPalette,
} from "@/lib/navigation/build-nav";

import type { TeamRole } from "@/lib/team/types";

export function useAppNavigation(isPortal: boolean, teamRole: TeamRole | null) {
  const tNav = useTranslations("common.nav");

  return useMemo(() => {
    const translate = (key: string) => tNav(key);
    const nav = isPortal
      ? buildNavigation(translate, { portal: true })
      : buildNavigation(translate, {
          portal: false,
          role: teamRole ?? "owner",
        });

    return {
      nav,
      commandItems: flattenForCommandPalette(nav),
    };
  }, [isPortal, teamRole, tNav]);
}
