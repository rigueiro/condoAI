"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { useOccurrences } from "@/lib/occurrences";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import { usePortfolio } from "@/lib/portfolio";
import NewOccurrenceModal from "../components/new-occurrence-modal";
import {
  OCCURRENCE_STATE_KEYS,
  PRIORITY_BADGE,
  STATE_BADGE,
} from "../components/occurrence-meta";
import {
  formatOccurrenceDate,
  toOccurrenceRow,
  type Occurrence,
  type OccurrenceComment,
} from "../types";

function DetailFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}

function OccurrenceDetailPage() {
  const t = useTranslations("occurrences.detail");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");
  const { user } = useAuth();
  const { portfolio } = usePortfolio();
  const { condominiums, owners, units } = portfolio;
  const { occurrences, isReady, upsertOccurrence } = useOccurrences();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const occurrence = useMemo(
    () => (id ? occurrences.find((o) => o.id === id) ?? null : null),
    [id, occurrences],
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const row = useMemo(
    () =>
      occurrence
        ? toOccurrenceRow(occurrence, condominiums, owners)
        : null,
    [occurrence, condominiums, owners],
  );

  const dateLabel = occurrence
    ? formatOccurrenceDate(occurrence.dateTime)
    : "";

  const timeline = useMemo(() => {
    if (!occurrence || !row) return [];
    const events = [
      {
        id: "reported",
        type: "reported" as const,
        author: row.ownerName ?? t("none"),
        message: "",
        createdAt: dateLabel,
      },
      ...occurrence.comments.map((c) => ({
        id: c.id,
        type: "comment" as const,
        author: c.author,
        message: c.message,
        createdAt: c.createdAt,
      })),
    ];
    return events;
  }, [occurrence, row, dateLabel, t]);

  if (!isReady) {
    return <DetailFrame />;
  }

  if (!id || !occurrence || !row) {
    return (
      <DetailFrame>
        <div className="bg-surface rounded-lg border border-border-light p-8 text-center">
          <Icon
            name="ClipboardX"
            size={48}
            className="text-secondary-300 mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {t("notFound")}
          </h2>
          <p className="text-text-secondary mb-4">{t("notFoundDesc")}</p>
          <Link
            href="/occurrences"
            className="inline-flex items-center space-x-2 text-primary hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>{t("backToList")}</span>
          </Link>
        </div>
      </DetailFrame>
    );
  }

  const stateBadge = STATE_BADGE[occurrence.status] ?? STATE_BADGE.Open;
  const priorityBadge =
    PRIORITY_BADGE[occurrence.priority] ?? PRIORITY_BADGE.LOW;

  const handleStateChange = (status: string) => {
    upsertOccurrence({
      ...occurrence,
      status: status as Occurrence["status"],
    });
  };

  const handleAddComment = () => {
    const message = newComment.trim();
    if (!message) return;
    const comment: OccurrenceComment = {
      id: crypto.randomUUID(),
      author: user?.name ?? t("you"),
      message,
      createdAt: formatOccurrenceDate(new Date()),
    };
    upsertOccurrence({
      ...occurrence,
      comments: [...occurrence.comments, comment],
    });
    setNewComment("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">
                {occurrence.title}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityBadge.bg} ${priorityBadge.color}`}
              >
                {tPriority(occurrence.priority)}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stateBadge.bg} ${stateBadge.color}`}
              >
                {tState(occurrence.status)}
              </span>
            </div>
            <p className="text-text-secondary">
              {tCategory(occurrence.category)} •{" "}
              {t("reportedByOn", {
                name: row.ownerName ?? t("none"),
                date: dateLabel,
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="bg-surface rounded-lg border border-border-light p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  {t("description")}
                </h2>
                <p className="text-text-secondary whitespace-pre-line">
                  {occurrence.description || t("noDescription")}
                </p>
              </section>

              <section className="bg-surface rounded-lg border border-border-light p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  {t("photos")}
                </h2>
                {occurrence.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {occurrence.photos.map((photo, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={index}
                        src={photo}
                        alt={`${occurrence.title} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border-light"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-secondary border border-dashed border-border-light rounded-lg">
                    <Icon
                      name="ImageOff"
                      size={36}
                      className="mx-auto mb-2 text-secondary-300"
                    />
                    <p>{t("noPhotos")}</p>
                  </div>
                )}
              </section>

              <section className="bg-surface rounded-lg border border-border-light p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  {t("activity")}
                </h2>

                <ol className="relative border-l border-border-light ml-2 space-y-6">
                  {timeline.map((event) => (
                    <li key={event.id} className="ml-6">
                      <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 ring-4 ring-surface">
                        <Icon
                          name={
                            event.type === "reported"
                              ? "Flag"
                              : "MessageSquare"
                          }
                          size={12}
                          className="text-primary"
                        />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {event.author}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {event.createdAt}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {event.type === "reported"
                          ? t("reportedEvent")
                          : event.message}
                      </p>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 pt-6 border-t border-border-light">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t("addComment")}
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
                    placeholder={t("commentPlaceholder")}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="inline-flex items-center space-x-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="Send" size={16} />
                      <span>{t("postComment")}</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="xl:col-span-1 space-y-6">
              <div className="bg-surface rounded-lg border border-border-light p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("occurrenceInfo")}
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-text-secondary">{t("category")}</dt>
                    <dd className="font-medium text-text-primary">
                      {tCategory(occurrence.category)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("priority")}</dt>
                    <dd className="font-medium text-text-primary">
                      {tPriority(occurrence.priority)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("property")}</dt>
                    <dd>
                      <Link
                        href={`/properties-management/${occurrence.condominiumId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.condominiumName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("unit")}</dt>
                    <dd className="font-medium text-text-primary">
                      {occurrence.unit ?? t("none")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("reportedBy")}</dt>
                    <dd>
                      {occurrence.ownerId ? (
                        <Link
                          href={`/owners-management/${occurrence.ownerId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.ownerName ?? occurrence.ownerId}
                        </Link>
                      ) : (
                        <span className="font-medium text-text-primary">
                          {t("none")}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("reportedAt")}</dt>
                    <dd className="font-medium text-text-primary">
                      {dateLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t("assignedTo")}</dt>
                    <dd className="font-medium text-text-primary">
                      {occurrence.assignedTo || t("unassigned")}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-surface rounded-lg border border-border-light p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {t("manage")}
                </h3>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t("changeStatus")}
                </label>
                <Select
                  value={occurrence.status}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  {OCCURRENCE_STATE_KEYS.map((state) => (
                    <option key={state} value={state}>
                      {tState(state)}
                    </option>
                  ))}
                </Select>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon name="Edit2" size={16} className="mr-2 shrink-0" />
                    {t("editOccurrence")}
                  </button>
                  <Link
                    href={`/properties-management/${occurrence.condominiumId}`}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon
                      name="Building2"
                      size={16}
                      className="mr-2 shrink-0"
                    />
                    {t("viewProperty")}
                  </Link>
                  {occurrence.ownerId && (
                    <Link
                      href={`/owners-management/${occurrence.ownerId}`}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                    >
                      <Icon name="User" size={16} className="mr-2 shrink-0" />
                      {t("viewOwner")}
                    </Link>
                  )}
                  <Link
                    href="/occurrences"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
                  >
                    <Icon
                      name="ClipboardList"
                      size={16}
                      className="mr-2 shrink-0"
                    />
                    {t("allOccurrences")}
                  </Link>
                </div>

                <Link
                  href="/occurrences"
                  className="mt-6 inline-flex items-center space-x-2 text-primary hover:underline text-sm font-medium"
                >
                  <Icon name="ArrowLeft" size={16} />
                  <span>{t("backToList")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <NewOccurrenceModal
          occurrence={occurrence}
          condominiums={condominiums}
          owners={owners}
          units={units}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            upsertOccurrence(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default OccurrenceDetailPage;
