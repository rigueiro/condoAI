"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Toast from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { usePortfolio } from "@/lib/portfolio";
import { useAssemblies } from "@/lib/assemblies";
import { useOperations, openOperationsDocument, vendorNameById } from "@/lib/operations";
import {
  PIPELINE_STEPS,
  awardedQuote,
  canAddQuote,
  canAwardQuote,
  canCancel,
  canComplete,
  canIssueQuota,
  canLinkAssembly,
  canLogWork,
  interventionsForProject,
  pipelineStates,
  statusTone,
  useWorks,
  worksErrorKey,
  type PipelineStep,
  type PipelineStepState,
} from "@/lib/works";
import ProjectModal from "../components/project-modal";
import QuoteModal from "../components/quote-modal";
import LinkAssemblyModal from "../components/link-assembly-modal";
import IssueQuotaModal from "../components/issue-quota-modal";
import InterventionModal from "../components/intervention-modal";

const STEP_ICONS: Record<PipelineStep, string> = {
  quotes: "Files",
  assembly: "Gavel",
  quota: "Wallet",
  vendor: "Hammer",
  worklog: "ClipboardList",
};

function stepClass(state: PipelineStepState): string {
  if (state === "done") return "border-success bg-success-50 text-success";
  if (state === "failed") return "border-error bg-error-50 text-error";
  if (state === "current") return "border-primary bg-primary-50 text-primary";
  return "border-border-light bg-surface text-text-secondary";
}

function WorksDetailPage() {
  const t = useTranslations("works");
  const { formatCurrency } = useFormatCurrency();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const { portfolio } = usePortfolio();
  const { assemblies } = useAssemblies();
  const { vendors } = useOperations();
  const {
    projects,
    interventions,
    updateProject,
    addQuote,
    removeQuote,
    awardQuote,
    linkAssembly,
    unlinkAssembly,
    issueExtraordinary,
    addIntervention,
    removeIntervention,
    completeProject,
    cancelProject,
  } = useWorks();

  const [editOpen, setEditOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [assemblyOpen, setAssemblyOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [flash, setFlash] = useState<{ message: string; tone: "success" | "warning" } | null>(null);

  const project = projects.find((row) => row.id === id);
  const vendorNames = useMemo(() => vendorNameById(vendors), [vendors]);
  const logs = useMemo(
    () => (project ? interventionsForProject(interventions, project.id) : []),
    [interventions, project],
  );
  const assembly = useMemo(
    () =>
      project?.assemblyId
        ? assemblies.find((row) => row.id === project.assemblyId) ?? null
        : null,
    [assemblies, project],
  );
  const agendaItem = assembly?.agenda.find((item) => item.id === project?.agendaItemId);
  const condoAssemblies = useMemo(
    () =>
      project
        ? assemblies.filter((row) => row.condominiumId === project.condominiumId)
        : [],
    [assemblies, project],
  );
  const condoName =
    portfolio.condominiums.find((c) => c.id === project?.condominiumId)?.name ??
    project?.condominiumId;
  const steps = project ? pipelineStates(project, logs.length) : null;
  const awarded = project ? awardedQuote(project) : null;

  const run = async (
    result:
      | Promise<{ ok: true } | { ok: false; code: string }>
      | { ok: true }
      | { ok: false; code: string },
    successKey: string,
  ) => {
    const resolved = await result;
    if (!resolved.ok) {
      setFlash({ message: t(`errors.${worksErrorKey(resolved.code)}`), tone: "warning" });
      return false;
    }
    setFlash({ message: t(successKey), tone: "success" });
    return true;
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Breadcrumb />
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("detail.notFound")}
          </h1>
          <p className="mt-2 text-text-secondary">{t("detail.notFoundDesc")}</p>
          <Link href="/works" className="mt-4 inline-flex text-sm font-medium text-primary">
            {t("detail.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Breadcrumb />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">
              {project.number} · {condoName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">
              {project.title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t(`categories.${project.category}`)}
              {project.location ? ` · ${project.location}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(project.status)}`}
            >
              {t(`statuses.${project.status}`)}
            </span>
            {canAddQuote(project) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                {t("detail.edit")}
              </Button>
            )}
            {canComplete(project, logs.length) && (
              <Button
                variant="success"
                size="sm"
                onClick={() => void run(completeProject(project.id), "flash.completed")}
              >
                {t("detail.complete")}
              </Button>
            )}
            {canCancel(project) && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (!window.confirm(t("detail.confirmCancel"))) return;
                  void run(cancelProject(project.id), "flash.cancelled");
                }}
              >
                {t("detail.cancel")}
              </Button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mb-6 text-sm text-text-secondary">{project.description}</p>
        )}

        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PIPELINE_STEPS.map((step) => (
            <div
              key={step}
              className={`rounded-xl border px-3 py-3 text-center ${stepClass(steps?.[step] ?? "blocked")}`}
            >
              <Icon name={STEP_ICONS[step]} size={18} className="mx-auto mb-1" />
              <p className="text-xs font-medium">{t(`pipeline.${step}`)}</p>
            </div>
          ))}
        </div>

        <section className="mb-6 rounded-xl border border-border-light bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {t("pipeline.quotes")}
            </h2>
            {canAddQuote(project) && (
              <Button variant="outline" size="sm" onClick={() => setQuoteOpen(true)}>
                {t("quote.add")}
              </Button>
            )}
          </div>
          {project.quotes.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("quote.empty")}</p>
          ) : (
            <ul className="divide-y divide-border-light">
              {project.quotes.map((quote) => {
                const awardedThis = project.awardedQuoteId === quote.id;
                return (
                  <li
                    key={quote.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {vendorNames.get(quote.vendorId) ?? quote.vendorId}
                        {awardedThis ? (
                          <span className="ml-2 text-xs font-medium text-success">
                            {t("quote.awarded")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatCurrency(quote.amount)}
                        {quote.description ? ` · ${quote.description}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {quote.document ? (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50"
                          onClick={() => {
                            const file = quote.document;
                            if (file) openOperationsDocument(file);
                          }}
                        >
                          <Icon name="FileText" size={16} />
                        </button>
                      ) : null}
                      {canAwardQuote(project) && !awardedThis && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void run(
                              awardQuote(project.id, quote.id),
                              "flash.awarded",
                            )
                          }
                        >
                          {t("quote.award")}
                        </Button>
                      )}
                      {canAddQuote(project) && (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error"
                          title={t("quote.remove")}
                          onClick={() => {
                            if (!window.confirm(t("detail.confirmRemoveQuote"))) return;
                            void run(
                              removeQuote(project.id, quote.id),
                              "flash.quoteRemoved",
                            );
                          }}
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mb-6 rounded-xl border border-border-light bg-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text-primary">
              {t("pipeline.assembly")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/assemblies?new=1&condo=${project.condominiumId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("assembly.create")}
              </Link>
              {canLinkAssembly(project) && (
                <Button variant="outline" size="sm" onClick={() => setAssemblyOpen(true)}>
                  {t("assembly.link")}
                </Button>
              )}
            </div>
          </div>
          {!project.assemblyId ? (
            <p className="text-sm text-text-secondary">{t("assembly.empty")}</p>
          ) : (
            <div className="text-sm">
              <p className="font-medium text-text-primary">
                {assembly?.title ?? project.assemblyId}
              </p>
              {agendaItem && (
                <p className="text-text-secondary">
                  {agendaItem.order}. {agendaItem.title}
                </p>
              )}
              <p className="mt-1">
                {project.resolutionPassed === true
                  ? t("assembly.passed")
                  : project.resolutionPassed === false
                    ? t("assembly.rejected")
                    : t("assembly.pending")}
              </p>
              <div className="mt-3 flex gap-2">
                {assembly && (
                  <Link
                    href={`/assemblies/${assembly.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t("assembly.open")}
                  </Link>
                )}
                {canLinkAssembly(project) && !project.extraordinaryQuotaId && (
                  <button
                    type="button"
                    className="text-sm text-text-secondary hover:text-error"
                    onClick={() =>
                      void run(unlinkAssembly(project.id), "flash.assemblyUnlinked")
                    }
                  >
                    {t("assembly.unlink")}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-xl border border-border-light bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {t("pipeline.quota")}
            </h2>
            {canIssueQuota(project) && (
              <Button variant="primary" size="sm" onClick={() => setQuotaOpen(true)}>
                {t("quota.issue")}
              </Button>
            )}
          </div>
          {project.extraordinaryQuotaId ? (
            <div className="text-sm">
              <p className="font-medium text-success">{t("quota.issued")}</p>
              {awarded && (
                <p className="text-text-secondary">{formatCurrency(awarded.amount)}</p>
              )}
              <Link
                href="/finance"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("quota.openFinance")}
              </Link>
            </div>
          ) : project.resolutionPassed === true ? (
            <p className="text-sm text-text-secondary">{t("quota.empty")}</p>
          ) : (
            <p className="text-sm text-text-secondary">{t("quota.blocked")}</p>
          )}
        </section>

        <section className="mb-6 rounded-xl border border-border-light bg-surface p-5">
          <h2 className="mb-3 text-base font-semibold text-text-primary">
            {t("pipeline.vendor")}
          </h2>
          {project.vendorId ? (
            <p className="text-sm">
              <span className="font-medium text-text-primary">
                {vendorNames.get(project.vendorId) ?? project.vendorId}
              </span>
              <span className="ml-2 text-text-secondary">{t("vendor.awarded")}</span>
            </p>
          ) : (
            <p className="text-sm text-text-secondary">{t("vendor.empty")}</p>
          )}
        </section>

        <section className="rounded-xl border border-border-light bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {t("pipeline.worklog")}
              </h2>
              {logs.length > 0 && (
                <p className="text-xs text-text-secondary">
                  {t("worklog.loggedCost")}:{" "}
                  {formatCurrency(
                    logs.reduce((sum, row) => sum + (Number(row.cost) || 0), 0),
                  )}
                </p>
              )}
            </div>
            {canLogWork(project) && (
              <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>
                {t("worklog.add")}
              </Button>
            )}
          </div>
          {!project.vendorId ? (
            <p className="text-sm text-text-secondary">{t("worklog.blocked")}</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("worklog.empty")}</p>
          ) : (
            <ul className="divide-y divide-border-light">
              {logs.map((row) => (
                <li key={row.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {String(row.date).slice(0, 10)} · {row.company}
                      </p>
                      <p className="text-sm text-text-secondary">{row.description}</p>
                      {row.cost > 0 && (
                        <p className="text-xs text-text-secondary">
                          {formatCurrency(row.cost)}
                        </p>
                      )}
                    </div>
                    {project.status !== "completed" && (
                      <button
                        type="button"
                        className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error"
                        title={t("worklog.remove")}
                        onClick={() => {
                          if (!window.confirm(t("detail.confirmRemoveLog"))) return;
                          void run(
                            removeIntervention(row.id),
                            "flash.logSaved",
                          );
                        }}
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    )}
                  </div>
                  {row.photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.photos.map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={photo.slice(0, 32)}
                          src={photo}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editOpen && (
        <ProjectModal
          project={project}
          condominiums={portfolio.condominiums.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
          onClose={() => setEditOpen(false)}
          onSave={async (input) =>
            run(
              await updateProject({
                id: project.id,
                title: input.title,
                description: input.description,
                category: input.category,
                location: input.location,
                notes: input.notes,
              }),
              "flash.saved",
            )
          }
        />
      )}
      {quoteOpen && (
        <QuoteModal
          projectId={project.id}
          condominiumId={project.condominiumId}
          onClose={() => setQuoteOpen(false)}
          onSave={async (input) => run(await addQuote(input), "flash.quoteSaved")}
        />
      )}
      {assemblyOpen && (
        <LinkAssemblyModal
          projectId={project.id}
          assemblies={condoAssemblies}
          onClose={() => setAssemblyOpen(false)}
          onSave={async (input) =>
            run(await linkAssembly(input), "flash.assemblyLinked")
          }
        />
      )}
      {quotaOpen && (
        <IssueQuotaModal
          project={project}
          units={portfolio.units}
          owners={portfolio.owners}
          onClose={() => setQuotaOpen(false)}
          onSave={async (input) =>
            run(await issueExtraordinary(input), "flash.quotaIssued")
          }
        />
      )}
      {logOpen && (
        <InterventionModal
          projectId={project.id}
          onClose={() => setLogOpen(false)}
          onSave={async (input) =>
            run(await addIntervention(input), "flash.logSaved")
          }
        />
      )}
      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={() => setFlash(null)}
        />
      )}
    </div>
  );
}

export default WorksDetailPage;
