"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import Toast from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { usePortfolio } from "@/lib/portfolio";
import { useCompliance } from "@/lib/compliance";
import { useAssemblies } from "@/lib/assemblies";
import { useFinance } from "@/lib/finance";
import { useOperations } from "@/lib/operations";
import { useWorks } from "@/lib/works";
import {
  buildDocumentArchive,
  DOCUMENT_TAB_KEYS,
  documentSourceHref,
  isCorePropertyDocument,
  type DocumentsTab,
  type ManagerDocument,
} from "@/lib/documents";
import {
  complianceFileLabel,
  openComplianceDocument,
} from "@/lib/compliance/files";
import CoreDocumentModal from "./components/core-document-modal";

function filterBySearch<T>(
  items: T[],
  searchLower: string,
  textFor: (item: T) => string,
): T[] {
  if (!searchLower) return items;
  return items.filter((item) =>
    textFor(item).toLowerCase().includes(searchLower),
  );
}

function DocumentsPage() {
  const t = useTranslations("documents");
  const { portfolio, upsertCondominium } = usePortfolio();
  const { policies, certificates } = useCompliance();
  const { assemblies } = useAssemblies();
  const { expenses } = useFinance();
  const { contracts } = useOperations();
  const { projects } = useWorks();

  const condominiums = portfolio.condominiums;
  const [condoFilter, setCondoFilter] = useState<string>("");
  const [tab, setTab] = useState<DocumentsTab>("all");
  const [search, setSearch] = useState("");
  const [coreEdit, setCoreEdit] = useState<{
    condominiumId: string;
    kind: "constitutive-title" | "internal-regulations";
  } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const dismissFlash = useCallback(() => setFlash(null), []);

  const condoOptions = useMemo(
    () => condominiums.map((c) => ({ id: c.id, name: c.name })),
    [condominiums],
  );

  const condoNameById = useMemo(
    () => new Map(condoOptions.map((c) => [c.id, c.name])),
    [condoOptions],
  );

  const nameOf = (id: string) => condoNameById.get(id) ?? id;
  const searchLower = search.trim().toLowerCase();
  const showCondoColumn = !condoFilter;

  const archive = useMemo(
    () =>
      buildDocumentArchive({
        condominiums,
        policies,
        certificates,
        assemblies,
        expenses,
        contracts,
        worksProjects: projects,
        condominiumId: condoFilter || null,
      }),
    [
      assemblies,
      certificates,
      condominiums,
      condoFilter,
      contracts,
      expenses,
      policies,
      projects,
    ],
  );

  const filtered = useMemo(() => {
    const byTab =
      tab === "all" ? archive : archive.filter((doc) => doc.kind === tab);
    return filterBySearch(byTab, searchLower, (doc) => {
      const condoName =
        condoNameById.get(doc.condominiumId) ?? doc.condominiumId;
      return `${doc.title} ${doc.subtitle ?? ""} ${condoName} ${t(`kinds.${doc.kind}`)}`;
    });
  }, [archive, condoNameById, searchLower, tab, t]);

  const { tabs, withFileCount } = useMemo(() => {
    const counts = new Map<DocumentsTab, number>([["all", archive.length]]);
    let files = 0;
    for (const doc of archive) {
      if (doc.file) files += 1;
      counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1);
    }
    return {
      withFileCount: files,
      tabs: DOCUMENT_TAB_KEYS.map((key) => ({
        key,
        count: counts.get(key) ?? 0,
      })),
    };
  }, [archive]);

  const editingCondo = coreEdit
    ? condominiums.find((c) => c.id === coreEdit.condominiumId)
    : undefined;

  const handleCoreSave = (condominium: Parameters<typeof upsertCondominium>[0]) => {
    upsertCondominium(condominium);
    setCoreEdit(null);
    setFlash(t("flash.saved"));
  };

  const fileCell = (doc: ManagerDocument) => {
    const label = complianceFileLabel(doc.file);
    if (doc.textOnly && !doc.file) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <Icon name="FileText" size={14} />
          {t("table.textOnly")}
        </span>
      );
    }
    if (!doc.file || !label) {
      return <span className="text-text-secondary">{t("table.noFile")}</span>;
    }
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        onClick={() => openComplianceDocument(doc.file!)}
      >
        <Icon name="Paperclip" size={14} />
        {t("table.viewFile", { type: label })}
      </button>
    );
  };

  const actionCell = (doc: ManagerDocument) => (
    <div className="flex justify-end gap-1">
      {isCorePropertyDocument(doc.kind) && (
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          title={t("table.upload")}
          onClick={() => {
            if (!isCorePropertyDocument(doc.kind)) return;
            setCoreEdit({
              condominiumId: doc.condominiumId,
              kind: doc.kind,
            });
          }}
        >
          <Icon name="Upload" size={16} />
        </button>
      )}
      <Link
        href={documentSourceHref(doc)}
        className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
        title={t("table.manage")}
      >
        <Icon name="ExternalLink" size={16} />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: t("stats.total"), value: archive.length, icon: "FolderOpen" },
            { label: t("stats.withFile"), value: withFileCount, icon: "Paperclip" },
            {
              label: t("stats.missing"),
              value: archive.length - withFileCount,
              icon: "AlertTriangle",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-light bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-2 text-text-secondary">
                <Icon name={stat.icon} size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
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
          <select
            value={condoFilter}
            onChange={(e) => setCondoFilter(e.target.value)}
            className="rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary sm:w-56"
          >
            <option value="">{t("filters.allProperties")}</option>
            {condoOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap gap-1 border-b border-border-light">
          {tabs.map(({ key, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-smooth ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t(`tabs.${key}`)}
              <span className="ml-1.5 text-xs text-text-secondary">
                ({count})
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-light bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-light bg-secondary-50 text-xs uppercase text-text-secondary">
              <tr>
                {showCondoColumn && (
                  <th className="px-4 py-3 font-medium">
                    {t("table.condominium")}
                  </th>
                )}
                <th className="px-4 py-3 font-medium">{t("table.kind")}</th>
                <th className="px-4 py-3 font-medium">{t("table.title")}</th>
                <th className="px-4 py-3 font-medium">{t("table.date")}</th>
                <th className="px-4 py-3 font-medium">{t("table.file")}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={showCondoColumn ? 6 : 5}
                    className="px-4 py-8 text-center text-text-secondary"
                  >
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id}>
                    {showCondoColumn && (
                      <td className="px-4 py-3 text-text-primary">
                        {nameOf(doc.condominiumId)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-text-secondary">
                      {t(`kinds.${doc.kind}`)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">
                        {doc.title}
                      </p>
                      {doc.subtitle && (
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {doc.subtitle}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {doc.date ?? "—"}
                    </td>
                    <td className="px-4 py-3">{fileCell(doc)}</td>
                    <td className="px-4 py-3 text-right">{actionCell(doc)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCondo && coreEdit && (
        <CoreDocumentModal
          condominium={editingCondo}
          kind={coreEdit.kind}
          onClose={() => setCoreEdit(null)}
          onSave={handleCoreSave}
        />
      )}

      {flash && (
        <Toast message={flash} tone="success" onDismiss={dismissFlash} />
      )}
    </div>
  );
}

export default DocumentsPage;
