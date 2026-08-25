"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Toast from "@/components/ui/toast";
import { Link, useRouter } from "@/i18n/navigation";
import { usePortfolio } from "@/lib/portfolio";
import {
  LEGAL_NOTICE_DAYS,
  assemblyErrorKey,
  noticeDays,
  noticeSatisfied,
  useAssemblies,
  type Assembly,
  type AssemblyStatus,
} from "@/lib/assemblies";
import AssemblyModal from "./components/assembly-modal";

function statusTone(status: AssemblyStatus): string {
  if (status === "in_session") return "bg-accent-50 text-accent-700";
  if (status === "summoned") return "bg-primary-50 text-primary";
  if (status === "closed") return "bg-secondary-100 text-text-secondary";
  return "bg-warning-50 text-warning";
}

function AssembliesContent() {
  const t = useTranslations("assemblies");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { portfolio } = usePortfolio();
  const { assemblies, createAssembly, upsertAssembly, removeAssembly } =
    useAssemblies();
  const condominiums = portfolio.condominiums;
  const condoFromQuery = searchParams.get("condo");
  const preferredId =
    condoFromQuery && condominiums.some((condo) => condo.id === condoFromQuery)
      ? condoFromQuery
      : (condominiums[0]?.id ?? "");
  const openNew = searchParams.get("new") === "1";
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Assembly | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const dismissFlash = useCallback(() => setFlash(null), []);

  useEffect(() => {
    if (!openNew) return;
    setEditing(null);
    setModalOpen(true);
  }, [openNew]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    if (openNew || condoFromQuery) {
      router.replace("/assemblies");
    }
  };

  const condoName = useMemo(
    () => new Map(condominiums.map((condo) => [condo.id, condo.name])),
    [condominiums],
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      upcoming: assemblies.filter(
        (row) =>
          (row.status === "summoned" || row.status === "draft") &&
          row.scheduledDate >= today,
      ).length,
      inSession: assemblies.filter((row) => row.status === "in_session").length,
      drafts: assemblies.filter((row) => row.status === "draft").length,
      closed: assemblies.filter((row) => row.status === "closed").length,
    };
  }, [assemblies]);

  const noticeLabel = (assembly: Assembly) => {
    const days = noticeDays(assembly);
    if (days == null) return t("notice.pending");
    if (noticeSatisfied(assembly)) return t("notice.ok", { days });
    return t("notice.short", { days, min: LEGAL_NOTICE_DAYS });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Breadcrumb />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t("add")}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("stats.upcoming"), value: stats.upcoming, icon: "Calendar" },
          { label: t("stats.inSession"), value: stats.inSession, icon: "Gavel" },
          { label: t("stats.drafts"), value: stats.drafts, icon: "FilePen" },
          { label: t("stats.closed"), value: stats.closed, icon: "CheckCircle" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border-light bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-2 text-text-secondary">
              <Icon name={stat.icon} size={16} />
              <span className="text-xs font-medium uppercase">{stat.label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-light bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-light bg-secondary-50 text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">{t("table.condominium")}</th>
              <th className="px-4 py-3 font-medium">{t("table.title")}</th>
              <th className="px-4 py-3 font-medium">{t("table.date")}</th>
              <th className="px-4 py-3 font-medium">{t("table.type")}</th>
              <th className="px-4 py-3 font-medium">{t("table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("table.notice")}</th>
              <th className="px-4 py-3 font-medium">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {assemblies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-secondary">
                  <p className="font-medium text-text-primary">{t("empty")}</p>
                  <p className="mt-1 text-sm">{t("emptyHint")}</p>
                </td>
              </tr>
            ) : (
              assemblies.map((assembly) => (
                <tr key={assembly.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-3">
                    {condoName.get(assembly.condominiumId) ?? assembly.condominiumId}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {assembly.title}
                  </td>
                  <td className="px-4 py-3">
                    {assembly.scheduledDate} {assembly.scheduledTime}
                  </td>
                  <td className="px-4 py-3">{t(`types.${assembly.type}`)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(assembly.status)}`}
                    >
                      {t(`statuses.${assembly.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {noticeLabel(assembly)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/assemblies/${assembly.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {t("table.open")}
                      </Link>
                      {assembly.status === "draft" && (
                        <button
                          type="button"
                          className="text-sm text-text-secondary hover:text-text-primary"
                          onClick={() => {
                            setEditing(assembly);
                            setModalOpen(true);
                          }}
                        >
                          {t("table.edit")}
                        </button>
                      )}
                      {assembly.status === "draft" && (
                        <button
                          type="button"
                          className="text-sm text-error hover:underline"
                          onClick={() => {
                            if (window.confirm(t("confirmDelete"))) {
                              removeAssembly(assembly.id);
                            }
                          }}
                        >
                          {t("table.delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        {t("notice.legalMin", { days: LEGAL_NOTICE_DAYS })}
      </p>

      {modalOpen && (
        <AssemblyModal
          assembly={editing}
          condominiums={condominiums.map((condo) => ({
            id: condo.id,
            name: condo.name,
          }))}
          defaultCondominiumId={preferredId}
          onClose={closeModal}
          onCreate={async (input) => {
            const result = await createAssembly(input);
            if (!result.ok) {
              setFlash(t(`errors.${assemblyErrorKey(result.code)}`));
              return false;
            }
            return true;
          }}
          onSave={upsertAssembly}
        />
      )}

      {flash && (
        <Toast
          message={flash}
          tone="warning"
          onDismiss={dismissFlash}
        />
      )}
    </div>
  );
}

function AssembliesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="h-40 rounded-lg border border-border-light bg-surface" />
          </div>
        }
      >
        <AssembliesContent />
      </Suspense>
    </div>
  );
}

export default AssembliesPage;
