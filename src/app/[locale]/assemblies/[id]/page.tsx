"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { formatPermillage, usePortfolio } from "@/lib/portfolio";
import {
  LEGAL_NOTICE_DAYS,
  MAJORITY_RULES,
  VOTE_CHOICES,
  attendingPermillage,
  canVote,
  defaultSummonsContent,
  firstCallQuorum,
  noticeDays,
  noticeSatisfied,
  quorumMet,
  tallyItem,
  useAssemblies,
  votingRoll,
  withVote,
  assemblyErrorKey,
  type AgendaItem,
  type Assembly,
  type AttendanceStatus,
  type MajorityRule,
  type VoteChoice,
} from "@/lib/assemblies";

const fieldClass =
  "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function errorMessage(
  t: ReturnType<typeof useTranslations<"assemblies">>,
  code: string,
): string {
  return t(`errors.${assemblyErrorKey(code)}`);
}

function AssemblyDetailPage() {
  const t = useTranslations("assemblies");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const { portfolio } = usePortfolio();
  const {
    assemblies,
    upsertAssembly,
    sendSummons,
    openSession,
    closeSession,
    isReady,
  } = useAssemblies();
  const [flash, setFlash] = useState<string | null>(null);
  const [summonsTitle, setSummonsTitle] = useState<string | null>(null);
  const [summonsContent, setSummonsContent] = useState<string | null>(null);
  const [summonsMethod, setSummonsMethod] = useState<"email" | "mail">("email");

  const assembly = assemblies.find((row) => row.id === id);
  const condo = portfolio.condominiums.find(
    (row) => row.id === assembly?.condominiumId,
  );
  const ownerById = useMemo(
    () => new Map(portfolio.owners.map((owner) => [owner.id, owner])),
    [portfolio.owners],
  );
  const roll = useMemo(
    () =>
      assembly
        ? votingRoll(portfolio.units, assembly.condominiumId)
        : [],
    [assembly, portfolio.units],
  );

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-40 rounded-lg border border-border-light bg-surface" />
        </div>
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumb />
          <p className="text-text-secondary">{t("detail.notFound")}</p>
          <Link href="/assemblies" className="mt-4 inline-block text-primary hover:underline">
            {t("detail.back")}
          </Link>
        </div>
      </div>
    );
  }

  const locked = assembly.status !== "draft";
  const inSession = assembly.status === "in_session";
  const closed = assembly.status === "closed";
  const attending = attendingPermillage(assembly, roll);
  const hasQuorum = quorumMet(assembly, roll, condo?.totalPermillage);
  const days = noticeDays(assembly);
  const draftContent =
    summonsContent ?? assembly.summons?.content ?? defaultSummonsContent(assembly);
  const draftTitle = summonsTitle ?? assembly.summons?.title ?? assembly.title;

  const showFlash = (code: string) => setFlash(errorMessage(t, code));

  const save = (next: Assembly) => upsertAssembly(next);

  const addAgendaItem = () => {
    const item: AgendaItem = {
      id: crypto.randomUUID(),
      order: assembly.agenda.length + 1,
      title: "",
      description: "",
      majority: "absolute-present",
    };
    save({ ...assembly, agenda: [...assembly.agenda, item] });
  };

  const updateAgenda = (itemId: string, patch: Partial<AgendaItem>) => {
    save({
      ...assembly,
      agenda: assembly.agenda.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeAgenda = (itemId: string) => {
    save({
      ...assembly,
      agenda: assembly.agenda
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index + 1 })),
    });
  };

  const setAttendance = (
    ownerId: string,
    status: AttendanceStatus,
    representedByOwnerId: string | null,
  ) => {
    const rest = assembly.attendance.filter((row) => row.ownerId !== ownerId);
    save({
      ...assembly,
      attendance: [...rest, { ownerId, status, representedByOwnerId }],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb />
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/assemblies"
              className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Icon name="ArrowLeft" size={14} />
              {t("detail.back")}
            </Link>
            <h1 className="text-2xl font-semibold text-text-primary">
              {assembly.title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {condo?.name ?? assembly.condominiumId} ·{" "}
              {t(`types.${assembly.type}`)} ·{" "}
              {t("detail.when", {
                date: assembly.scheduledDate,
                time: assembly.scheduledTime,
              })}
              {assembly.location ? ` · ${assembly.location}` : ""}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {closed
                ? t("detail.closedHint")
                : inSession
                  ? t("detail.sessionHint")
                  : assembly.status === "summoned"
                    ? t("detail.summonedHint")
                    : t("detail.draftHint", { days: LEGAL_NOTICE_DAYS })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {assembly.status === "draft" && (
              <Button
                onClick={async () => {
                  const result = await sendSummons({
                    id: assembly.id,
                    method: summonsMethod,
                    title: draftTitle,
                    content: draftContent,
                  });
                  if (!result.ok) showFlash(result.code);
                }}
              >
                {t("detail.sendSummons")}
              </Button>
            )}
            {assembly.status === "summoned" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  const result = await openSession(assembly.id, 1);
                  if (!result.ok) showFlash(result.code);
                }}
              >
                {t("detail.openSession")}
              </Button>
            )}
            {(assembly.status === "summoned" ||
              (inSession && assembly.call === 1)) && (
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await openSession(assembly.id, 2);
                  if (!result.ok) showFlash(result.code);
                }}
              >
                {t("detail.openSecondCall")}
              </Button>
            )}
            {inSession && (
              <Button
                variant="success"
                onClick={async () => {
                  const result = await closeSession(assembly.id);
                  if (!result.ok) showFlash(result.code);
                }}
              >
                {t("detail.close")}
              </Button>
            )}
          </div>
        </div>

        {flash && (
          <p className="mb-4 rounded-lg border border-error-100 bg-error-50 px-3 py-2 text-sm text-error">
            {flash}
          </p>
        )}

        <div className="space-y-6">
          <section className="rounded-xl border border-border-light bg-surface p-5">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">
              {t("agenda.title")}
            </h2>
            {locked && (
              <p className="mb-3 text-xs text-text-secondary">{t("agenda.locked")}</p>
            )}
            {assembly.agenda.length === 0 && (
              <p className="mb-3 text-sm text-text-secondary">{t("agenda.empty")}</p>
            )}
            <ol className="space-y-4">
              {[...assembly.agenda]
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <li key={item.id} className="rounded-lg border border-border-light p-4">
                    <p className="mb-2 text-xs font-medium uppercase text-text-secondary">
                      {t("agenda.item", { n: index + 1 })}
                    </p>
                    <input
                      className={`${fieldClass} mb-2`}
                      value={item.title}
                      disabled={locked}
                      placeholder={t("agenda.itemTitle")}
                      onChange={(event) =>
                        updateAgenda(item.id, { title: event.target.value })
                      }
                    />
                    <textarea
                      className={`${fieldClass} mb-2 min-h-16`}
                      value={item.description}
                      disabled={locked}
                      placeholder={t("agenda.description")}
                      onChange={(event) =>
                        updateAgenda(item.id, { description: event.target.value })
                      }
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Select
                        selectSize="sm"
                        value={item.majority}
                        disabled={locked}
                        onChange={(event) =>
                          updateAgenda(item.id, {
                            majority: event.target.value as MajorityRule,
                          })
                        }
                        containerClassName="max-w-md"
                      >
                        {MAJORITY_RULES.map((rule) => (
                          <option key={rule} value={rule}>
                            {t(`majority.${rule}`)}
                          </option>
                        ))}
                      </Select>
                      {!locked && (
                        <button
                          type="button"
                          className="text-sm text-error hover:underline"
                          onClick={() => removeAgenda(item.id)}
                        >
                          {t("agenda.remove")}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
            {!locked && (
              <button
                type="button"
                onClick={addAgendaItem}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                {t("agenda.add")}
              </button>
            )}
          </section>

          <section className="rounded-xl border border-border-light bg-surface p-5">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">
              {t("summons.title")}
            </h2>
            {assembly.summons && days != null && (
              <p
                className={`mb-3 text-sm ${noticeSatisfied(assembly) ? "text-success" : "text-warning"}`}
              >
                {noticeSatisfied(assembly)
                  ? t("summons.legalOk", { days })
                  : t("summons.legalShort", { days, min: LEGAL_NOTICE_DAYS })}
              </p>
            )}
            {assembly.summons && (
              <p className="mb-3 text-sm text-text-secondary">
                {t("summons.sentOn", { date: assembly.summons.sentDate })} ·{" "}
                {t(`methods.${assembly.summons.method}`)}
              </p>
            )}
            <div className="mb-3 max-w-xs">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                {t("summons.method")}
              </label>
              <Select
                value={assembly.summons?.method ?? summonsMethod}
                disabled={locked}
                onChange={(event) =>
                  setSummonsMethod(event.target.value as "email" | "mail")
                }
              >
                <option value="email">{t("methods.email")}</option>
                <option value="mail">{t("methods.mail")}</option>
              </Select>
            </div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t("summons.body")}
            </label>
            <p className="mb-2 text-xs text-text-secondary">{t("summons.bodyHint")}</p>
            <input
              className={`${fieldClass} mb-2`}
              value={draftTitle}
              disabled={locked}
              onChange={(event) => setSummonsTitle(event.target.value)}
            />
            <textarea
              className={`${fieldClass} min-h-40`}
              value={draftContent}
              disabled={locked}
              onChange={(event) => setSummonsContent(event.target.value)}
            />
          </section>

          {(inSession || closed) && (
            <section className="rounded-xl border border-border-light bg-surface p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("attendance.title")}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {t("attendance.attending", {
                      amount: formatPermillage(attending),
                    })}{" "}
                    · {t(`call.${assembly.call === 2 ? "second" : "first"}`)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-text-primary">
                    {t("attendance.quorum")}{" "}
                    {hasQuorum ? t("attendance.met") : t("attendance.notMet")}
                  </p>
                  {assembly.call === 1 && (
                    <p className="text-text-secondary">
                      {t("attendance.needed", {
                        amount: formatPermillage(
                          firstCallQuorum(condo?.totalPermillage),
                        ),
                      })}
                    </p>
                  )}
                  {assembly.call === 2 && (
                    <p className="text-text-secondary">
                      {t("attendance.secondCall")}
                    </p>
                  )}
                </div>
              </div>
              {roll.length === 0 ? (
                <p className="text-sm text-text-secondary">{t("attendance.none")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-text-secondary">
                      <tr>
                        <th className="py-2 pr-3 font-medium">{t("attendance.owner")}</th>
                        <th className="py-2 pr-3 font-medium">{t("attendance.units")}</th>
                        <th className="py-2 pr-3 font-medium">{t("attendance.share")}</th>
                        <th className="py-2 pr-3 font-medium">{t("attendance.status")}</th>
                        <th className="py-2 font-medium">{t("attendance.proxy")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {roll.map((share) => {
                        const row = assembly.attendance.find(
                          (item) => item.ownerId === share.ownerId,
                        );
                        const status = row?.status ?? "absent";
                        return (
                          <tr key={share.ownerId}>
                            <td className="py-2 pr-3">
                              {ownerById.get(share.ownerId)?.fullName ?? share.ownerId}
                            </td>
                            <td className="py-2 pr-3 text-text-secondary">
                              {share.unitLabels.join(", ")}
                            </td>
                            <td className="py-2 pr-3">
                              {formatPermillage(share.permillage)}
                            </td>
                            <td className="py-2 pr-3">
                              <Select
                                selectSize="sm"
                                value={status}
                                disabled={closed}
                                onChange={(event) =>
                                  setAttendance(
                                    share.ownerId,
                                    event.target.value as AttendanceStatus,
                                    row?.representedByOwnerId ?? null,
                                  )
                                }
                              >
                                <option value="present">
                                  {t("attendanceStatus.present")}
                                </option>
                                <option value="represented">
                                  {t("attendanceStatus.represented")}
                                </option>
                                <option value="absent">
                                  {t("attendanceStatus.absent")}
                                </option>
                              </Select>
                            </td>
                            <td className="py-2">
                              {status === "represented" ? (
                                <Select
                                  selectSize="sm"
                                  value={row?.representedByOwnerId ?? ""}
                                  disabled={closed}
                                  onChange={(event) =>
                                    setAttendance(
                                      share.ownerId,
                                      "represented",
                                      event.target.value || null,
                                    )
                                  }
                                >
                                  <option value="">—</option>
                                  {roll
                                    .filter((other) => other.ownerId !== share.ownerId)
                                    .map((other) => (
                                      <option key={other.ownerId} value={other.ownerId}>
                                        {ownerById.get(other.ownerId)?.fullName ??
                                          other.ownerId}
                                      </option>
                                    ))}
                                </Select>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {(inSession || closed) && (
            <section className="rounded-xl border border-border-light bg-surface p-5">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("voting.title")}
              </h2>
              {!hasQuorum && inSession && (
                <p className="mb-3 text-sm text-warning">{t("voting.needQuorum")}</p>
              )}
              {closed && (
                <p className="mb-3 text-sm text-text-secondary">{t("voting.closed")}</p>
              )}
              <div className="space-y-6">
                {[...assembly.agenda]
                  .sort((a, b) => a.order - b.order)
                  .map((item) => {
                    const tally = tallyItem(
                      assembly,
                      item,
                      roll,
                      condo?.totalPermillage,
                    );
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border-light p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-text-primary">
                              {item.order}. {item.title || t("agenda.itemTitle")}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {t(`majority.${item.majority}`)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              tally.passed
                                ? "bg-success-50 text-success"
                                : "bg-secondary-100 text-text-secondary"
                            }`}
                          >
                            {tally.passed
                              ? t("voting.resultPass")
                              : t("voting.resultFail")}
                          </span>
                        </div>
                        <p className="mb-3 text-xs text-text-secondary">
                          {t("voting.for", {
                            amount: formatPermillage(tally.forPermillage),
                          })}{" "}
                          ·{" "}
                          {t("voting.against", {
                            amount: formatPermillage(tally.againstPermillage),
                          })}{" "}
                          ·{" "}
                          {t("voting.abstain", {
                            amount: formatPermillage(tally.abstainPermillage),
                          })}{" "}
                          ·{" "}
                          {t("voting.unvoted", {
                            amount: formatPermillage(tally.unvotedPermillage),
                          })}
                        </p>
                        <ul className="space-y-2">
                          {roll.map((share) => {
                            const enabled = canVote(assembly, share.ownerId);
                            const choice =
                              assembly.votes.find((row) => row.itemId === item.id)
                                ?.ballots[share.ownerId] ?? "";
                            return (
                              <li
                                key={share.ownerId}
                                className="flex flex-wrap items-center justify-between gap-2"
                              >
                                <span className="text-sm">
                                  {ownerById.get(share.ownerId)?.fullName ??
                                    share.ownerId}{" "}
                                  <span className="text-text-secondary">
                                    ({formatPermillage(share.permillage)})
                                  </span>
                                </span>
                                <Select
                                  selectSize="sm"
                                  value={choice}
                                  disabled={!enabled || closed}
                                  onChange={(event) => {
                                    const next = event.target.value as VoteChoice;
                                    if (!next) return;
                                    save(
                                      withVote(
                                        assembly,
                                        item.id,
                                        share.ownerId,
                                        next,
                                      ),
                                    );
                                  }}
                                  containerClassName="w-40"
                                >
                                  <option value="">—</option>
                                  {VOTE_CHOICES.map((vote) => (
                                    <option key={vote} value={vote}>
                                      {t(`vote.${vote}`)}
                                    </option>
                                  ))}
                                </Select>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {(inSession || closed) && (
            <section className="rounded-xl border border-border-light bg-surface p-5">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("minutes.title")}
              </h2>
              <textarea
                className={`${fieldClass} min-h-40`}
                value={assembly.minutes.text}
                disabled={closed}
                placeholder={t("minutes.placeholder")}
                onChange={(event) =>
                  save({
                    ...assembly,
                    minutes: { ...assembly.minutes, text: event.target.value },
                  })
                }
              />
              {inSession && !assembly.minutes.text.trim() && (
                <p className="mt-2 text-xs text-warning">{t("minutes.required")}</p>
              )}
            </section>
          )}

          {closed && (
            <section className="rounded-xl border border-border-light bg-surface p-5">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {t("resolutions.title")}
              </h2>
              {assembly.resolutions.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  {t("resolutions.empty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {assembly.resolutions.map((resolution) => (
                    <li
                      key={resolution.id}
                      className="rounded-lg border border-border-light p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-medium text-text-primary">
                          {resolution.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            resolution.passed
                              ? "bg-success-50 text-success"
                              : "bg-secondary-100 text-text-secondary"
                          }`}
                        >
                          {resolution.passed
                            ? t("resolutions.passed")
                            : t("resolutions.rejected")}
                        </span>
                      </div>
                      {resolution.text !== resolution.title && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {resolution.text}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-text-secondary">
                        {t("resolutions.tally", {
                          for: formatPermillage(resolution.forPermillage),
                          against: formatPermillage(resolution.againstPermillage),
                          abstain: formatPermillage(resolution.abstainPermillage),
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssemblyDetailPage;
