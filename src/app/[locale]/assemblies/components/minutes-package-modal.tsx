"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import { formatPermillage } from "@/lib/portfolio";
import { openComplianceDocument } from "@/lib/compliance/files";
import type { MinutesPackage } from "@/lib/assemblies";
import { usePrintDocument } from "@/app/[locale]/owners-management/components/use-print-document";

function MinutesPackageModal({
  pack,
  onClose,
}: {
  pack: MinutesPackage;
  onClose: () => void;
}) {
  const t = useTranslations("assemblies.package");
  const print = usePrintDocument(true);

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center bg-black/50 p-4 print:static print:bg-transparent print:p-0 print-document">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface shadow-xl print:max-h-none print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-border-light p-6 print:hidden">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover"
            onClick={onClose}
            aria-label={t("close")}
          >
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <article className="space-y-6 p-6 text-text-primary">
          <header className="border-b border-border-medium pb-4">
            <p className="text-sm font-medium text-text-secondary">
              {pack.condominiumName}
            </p>
            <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide">
              {t("documentTitle")}
            </h1>
            <p className="mt-2 text-base font-semibold">{pack.title}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {t("when", {
                date: pack.scheduledDate,
                time: pack.scheduledTime,
                location: pack.location,
              })}
            </p>
            <p className="text-sm text-text-secondary">
              {t("call", { call: pack.call })}
              {pack.recordedAt
                ? ` · ${t("recorded", { date: pack.recordedAt })}`
                : ""}
            </p>
          </header>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              {t("attendance")}
            </h3>
            <ul className="space-y-1 text-sm">
              {pack.attendance.map((row) => (
                <li key={row.ownerId}>
                  <span className="font-medium">{row.name}</span>
                  {" — "}
                  {row.status === "represented" && row.proxyName
                    ? t("representedBy", { proxy: row.proxyName })
                    : t(`status.${row.status}`)}
                  {" · "}
                  {formatPermillage(row.permillage)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-text-secondary">
              {t("quorumLine", {
                attending: formatPermillage(pack.attendingPermillage),
                total: formatPermillage(pack.totalCapital),
                quorum: pack.quorumMet ? t("quorumOk") : t("quorumFail"),
              })}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              {t("resolutions")}
            </h3>
            {pack.resolutions.length === 0 ? (
              <p className="text-sm text-text-secondary">{t("noResolutions")}</p>
            ) : (
              <ol className="list-decimal space-y-3 pl-5 text-sm">
                {pack.resolutions.map((resolution) => (
                  <li key={resolution.id} className="pl-1">
                    <p className="font-medium">{resolution.title}</p>
                    {resolution.text !== resolution.title && (
                      <p className="text-text-secondary">{resolution.text}</p>
                    )}
                    <p className="mt-1 text-text-secondary">
                      {t("tally", {
                        for: formatPermillage(resolution.forPermillage),
                        against: formatPermillage(resolution.againstPermillage),
                        abstain: formatPermillage(resolution.abstainPermillage),
                      })}
                      {" — "}
                      <span
                        className={
                          resolution.passed
                            ? "text-success"
                            : "text-text-secondary"
                        }
                      >
                        {resolution.passed ? t("passed") : t("rejected")}
                      </span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {pack.narrative ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                {t("narrative")}
              </h3>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {pack.narrative}
              </pre>
            </section>
          ) : null}

          {pack.file ? (
            <p className="text-sm text-text-secondary print:hidden">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => openComplianceDocument(pack.file!)}
              >
                {t("openFile")}
              </button>
            </p>
          ) : null}
        </article>

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-border-light p-6 sm:flex-row print:hidden">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
          <Button type="button" iconName="Printer" onClick={print}>
            {t("print")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MinutesPackageModal;
