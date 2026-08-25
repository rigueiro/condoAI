"use client";

import { useTranslations } from "next-intl";
import type { Announcement } from "@/lib/announcements";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";

type AnnouncementsResponse = {
  announcements: Announcement[];
};

export default function PortalAnnouncementsPage() {
  const t = useTranslations("portal");
  const { condominiumId } = usePortalCondo();
  const { data, error, loading } = usePortalFetch<AnnouncementsResponse>(
    condominiumId
      ? `/api/portal/announcements?condominiumId=${encodeURIComponent(condominiumId)}`
      : null,
  );

  return (
    <PortalShell
      title={t("announcements.title")}
      subtitle={t("announcements.subtitle")}
    >
      {loading ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : !data?.announcements.length ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("announcements.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border-light rounded-lg border border-border-light bg-surface">
          {data.announcements.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {t(`announcements.audience.${item.audience}`)}
                </span>
                {item.sentAt && (
                  <span className="text-xs text-text-secondary">
                    {t("announcements.sentOn", {
                      date: item.sentAt.slice(0, 10),
                    })}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-text-primary">
                {item.subject}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
