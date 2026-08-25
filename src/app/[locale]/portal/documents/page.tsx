"use client";

import { useTranslations } from "next-intl";
import { openComplianceDocument } from "@/lib/compliance/files";
import type { PortalDocument } from "@/lib/memberships";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";

type DocumentsResponse = {
  documents: PortalDocument[];
};

export default function PortalDocumentsPage() {
  const t = useTranslations("portal");
  const { condominiumId } = usePortalCondo();
  const { data, error, loading } = usePortalFetch<DocumentsResponse>(
    condominiumId
      ? `/api/portal/documents?condominiumId=${encodeURIComponent(condominiumId)}`
      : null,
  );

  return (
    <PortalShell
      title={t("documents.title")}
      subtitle={t("documents.subtitle")}
    >
      {loading ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : !data?.documents.length ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {t("documents.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border-light rounded-lg border border-border-light bg-surface">
          {data.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t(`documents.kinds.${doc.kind}`)}
                  {doc.title ? ` — ${doc.title}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {[doc.subtitle, doc.date].filter(Boolean).join(" · ")}
                </p>
              </div>
              {doc.file ? (
                <button
                  type="button"
                  onClick={() => openComplianceDocument(doc.file!)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("documents.open")}
                </button>
              ) : (
                <span className="text-xs text-text-secondary">
                  {t("documents.noFile")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
