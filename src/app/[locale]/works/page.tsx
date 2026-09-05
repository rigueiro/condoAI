"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import Toast from "@/components/ui/toast";
import { Link, useRouter } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { usePortfolio } from "@/lib/portfolio";
import { useOperations, vendorNameById } from "@/lib/operations";
import {
  WORKS_STATUSES,
  canDeleteProject,
  statusTone,
  toWorksProjectRows,
  worksErrorKey,
  worksMatchesSearch,
  useWorks,
  type CreateWorksProjectInput,
  type WorksStatus,
} from "@/lib/works";
import ProjectModal from "./components/project-modal";

function WorksContent() {
  const t = useTranslations("works");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useFormatCurrency();
  const { portfolio } = usePortfolio();
  const { vendors } = useOperations();
  const {
    projects,
    interventions,
    createProject,
    removeProject,
  } = useWorks();

  const condominiums = portfolio.condominiums;
  const condoFromQuery = searchParams.get("condo");
  const preferredId =
    condoFromQuery && condominiums.some((condo) => condo.id === condoFromQuery)
      ? condoFromQuery
      : (condominiums[0]?.id ?? "");
  const openNew = searchParams.get("new") === "1";

  const [userOpen, setUserOpen] = useState(false);
  const modalOpen = userOpen || openNew;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [flash, setFlash] = useState<{ message: string; tone: "success" | "warning" } | null>(null);

  const dismissFlash = useCallback(() => setFlash(null), []);

  const vendorNames = useMemo(() => vendorNameById(vendors), [vendors]);
  const rows = useMemo(
    () =>
      toWorksProjectRows(
        projects,
        condominiums,
        vendorNames,
        interventions,
      ),
    [condominiums, interventions, projects, vendorNames],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.project.status !== statusFilter) return false;
      return worksMatchesSearch(row, query);
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(
    () => ({
      quoting: projects.filter(
        (p) => p.status === "quoting" || p.status === "draft",
      ).length,
      pendingVote: projects.filter((p) => p.status === "pending_vote").length,
      inProgress: projects.filter(
        (p) => p.status === "in_progress" || p.status === "funded",
      ).length,
      completed: projects.filter((p) => p.status === "completed").length,
    }),
    [projects],
  );

  const closeModal = () => {
    setUserOpen(false);
    if (openNew || condoFromQuery) router.replace("/works");
  };

  const handleCreate = async (input: CreateWorksProjectInput & { id?: string }) => {
    const result = await createProject(input);
    if (!result.ok) {
      setFlash({ message: t(`errors.${worksErrorKey(result.code)}`), tone: "warning" });
      return false;
    }
    setFlash({ message: t("flash.saved"), tone: "success" });
    return true;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("detail.confirmDelete"))) return;
    const result = await removeProject(id);
    if (!result.ok) {
      setFlash({ message: t(`errors.${worksErrorKey(result.code)}`), tone: "warning" });
      return;
    }
    setFlash({ message: t("flash.deleted"), tone: "success" });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Breadcrumb />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="primary" iconName="Plus" onClick={() => setUserOpen(true)}>
          {t("add")}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["quoting", stats.quoting, "Files"],
            ["pendingVote", stats.pendingVote, "Gavel"],
            ["inProgress", stats.inProgress, "Hammer"],
            ["completed", stats.completed, "CheckCircle"],
          ] as const
        ).map(([key, value, icon]) => (
          <div
            key={key}
            className="rounded-xl border border-border-light bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-2 text-text-secondary">
              <Icon name={icon} size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                {t(`stats.${key}`)}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <div className="relative">
          <Icon
            name="Search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("filters.search")}
            className="w-full rounded-lg border border-border-medium bg-surface py-2 pl-9 pr-3 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t("filters.allStatuses")}</option>
          {WORKS_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`statuses.${status}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-light bg-surface">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-text-secondary">
            <Icon name="HardHat" size={40} className="mx-auto mb-2 text-secondary-300" />
            <p>{t("table.empty")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">{t("table.number")}</th>
                <th className="px-4 py-3">{t("table.title")}</th>
                <th className="px-4 py-3">{t("table.condominium")}</th>
                <th className="px-4 py-3">{t("table.status")}</th>
                <th className="px-4 py-3">{t("table.vendor")}</th>
                <th className="px-4 py-3 text-right">{t("table.awarded")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.project.id} className="border-t border-border-light">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <Link href={`/works/${row.project.id}`} className="hover:text-primary">
                      {row.project.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/works/${row.project.id}`} className="hover:text-primary">
                      {row.project.title}
                    </Link>
                    <p className="text-xs text-text-secondary">
                      {t(`categories.${row.project.category}`)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{row.condominiumName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.project.status as WorksStatus)}`}
                    >
                      {t(`statuses.${row.project.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.vendorName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.awardedAmount != null
                      ? formatCurrency(row.awardedAmount)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error disabled:opacity-40"
                      title={t("table.delete")}
                      disabled={!canDeleteProject(row.project, row.interventionCount)}
                      onClick={() => void handleDelete(row.project.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          project={null}
          condominiums={condominiums.map((c) => ({ id: c.id, name: c.name }))}
          defaultCondominiumId={preferredId}
          onClose={closeModal}
          onSave={handleCreate}
        />
      )}

      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={dismissFlash}
        />
      )}
    </div>
  );
}

function WorksPage() {
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
        <WorksContent />
      </Suspense>
    </div>
  );
}

export default WorksPage;
