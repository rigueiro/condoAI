"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import type { Announcement } from "@/lib/announcements";
import { useActiveCondominium } from "@/lib/portfolio/active-condominium";
import { usePortfolio } from "@/lib/portfolio";
import ComposeModal from "./components/compose-modal";

type AnnouncementsResponse = {
  announcements: Announcement[];
};

export default function AnnouncementsPage() {
  const t = useTranslations("announcements");
  const tAudience = useTranslations("announcements.audience");
  const { portfolio } = usePortfolio();
  const { activeId } = useActiveCondominium();
  const condominiumId = activeId ?? portfolio.condominiums[0]?.id ?? "";
  const condoName = useMemo(
    () =>
      portfolio.condominiums.find((c) => c.id === condominiumId)?.name ?? "",
    [condominiumId, portfolio.condominiums],
  );

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!condominiumId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<AnnouncementsResponse>(
        `/api/announcements?condominiumId=${encodeURIComponent(condominiumId)}`,
      );
      setAnnouncements(data.announcements);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [condominiumId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Breadcrumb />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
            {condoName && (
              <p className="mt-2 text-sm text-text-secondary">{condoName}</p>
            )}
          </div>
          <Button
            iconName="Send"
            onClick={() => setModalOpen(true)}
            disabled={!condominiumId}
          >
            {t("compose")}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-text-secondary">…</p>
        ) : announcements.length === 0 ? (
          <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border-light rounded-lg border border-border-light bg-surface">
            {announcements.map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {tAudience(item.audience)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {item.sentAt?.slice(0, 10)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {t("sentTo", { count: item.recipientCount })}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  {item.subject}
                </p>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-text-secondary">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      {modalOpen && condominiumId && (
        <ComposeModal
          condominiumId={condominiumId}
          onClose={() => setModalOpen(false)}
          onSent={load}
        />
      )}
    </div>
  );
}
