"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import {
  canPortal,
  canPortalComment,
  type PortalOccurrence,
} from "@/lib/memberships";
import PortalShell from "../components/portal-shell";
import { usePortalCondo, usePortalFetch } from "../components/use-portal-condo";
import PortalSubmitOccurrenceForm from "./submit-form";

type OccurrencesResponse = {
  occurrences: PortalOccurrence[];
};

function day(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function upsertOccurrence(
  list: PortalOccurrence[],
  item: PortalOccurrence,
): PortalOccurrence[] {
  const index = list.findIndex((occ) => occ.id === item.id);
  if (index === -1) return [item, ...list];
  const next = list.slice();
  next[index] = item;
  return next;
}

export default function PortalOccurrencesPage() {
  const t = useTranslations("portal");
  const tOcc = useTranslations("portal.occurrences");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");
  const { condominiumId, selected } = usePortalCondo();
  const { data, error, loading } = usePortalFetch<OccurrencesResponse>(
    condominiumId
      ? `/api/portal/occurrences?condominiumId=${encodeURIComponent(condominiumId)}`
      : null,
  );

  const canCreate = Boolean(
    selected && canPortal(selected.role, "createOccurrence"),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [overlay, setOverlay] = useState<PortalOccurrence[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    setOverlay([]);
    setExpandedId(null);
    setFormOpen(false);
    setCommentDraft("");
    setCommentError(null);
  }, [condominiumId]);

  const occurrences = useMemo(() => {
    let list = data?.occurrences ?? [];
    for (const item of overlay) list = upsertOccurrence(list, item);
    return list;
  }, [data?.occurrences, overlay]);

  const patch = (occurrence: PortalOccurrence) => {
    setOverlay((prev) => upsertOccurrence(prev, occurrence));
  };

  const handleComment = async (occurrence: PortalOccurrence) => {
    if (!condominiumId) return;
    const message = commentDraft.trim();
    if (!message) return;
    setCommentBusy(true);
    setCommentError(null);
    try {
      const result = await apiFetch<{ occurrence: PortalOccurrence }>(
        "/api/portal/occurrences",
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "addComment",
            condominiumId,
            occurrenceId: occurrence.id,
            message,
          }),
        },
      );
      patch(result.occurrence);
      setCommentDraft("");
    } catch {
      setCommentError(tOcc("commentFailed"));
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <PortalShell
      title={t("occurrences.title")}
      subtitle={t("occurrences.subtitle")}
    >
      {canCreate && selected && (
        <div className="mb-4 flex justify-end">
          <Button iconName="Plus" onClick={() => setFormOpen(true)}>
            {tOcc("report")}
          </Button>
        </div>
      )}

      {formOpen && selected && (
        <PortalSubmitOccurrenceForm
          membership={selected}
          onClose={() => setFormOpen(false)}
          onCreated={(occurrence) => {
            patch(occurrence);
            setFormOpen(false);
            setExpandedId(occurrence.id);
          }}
        />
      )}

      {loading && occurrences.length === 0 ? (
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      ) : error && occurrences.length === 0 ? (
        <p className="text-sm text-error">{t("loadError")}</p>
      ) : !occurrences.length ? (
        <p className="rounded-lg border border-border-light bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {canCreate ? tOcc("emptyCanSubmit") : t("occurrences.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border-light rounded-lg border border-border-light bg-surface">
          {occurrences.map((occ) => {
            const open = expandedId === occ.id;
            const meta = [
              occ.unit ? `${t("occurrences.unit")}: ${occ.unit}` : "",
              occ.dateTime
                ? `${t("occurrences.reported")}: ${day(occ.dateTime)}`
                : "",
              occ.lastUpdate
                ? `${t("occurrences.lastUpdate")}: ${day(occ.lastUpdate)}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={occ.id} className="px-6 py-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setExpandedId(open ? null : occ.id);
                    setCommentDraft("");
                    setCommentError(null);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                      {tState(occ.status)}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-text-secondary">
                      {tPriority(occ.priority)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {tCategory(occ.category)}
                    </span>
                    {occ.photos.length > 0 && (
                      <span className="text-xs text-text-secondary">
                        {tOcc("photoCount", { count: occ.photos.length })}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {occ.title}
                  </p>
                  {meta ? (
                    <p className="mt-1 text-xs text-text-secondary">{meta}</p>
                  ) : null}
                </button>

                {open && (
                  <div className="mt-4 space-y-4 border-t border-border-light pt-4">
                    {occ.description ? (
                      <p className="whitespace-pre-line text-sm text-text-secondary">
                        {occ.description}
                      </p>
                    ) : null}

                    {occ.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {occ.photos.map((photo, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={index}
                            src={photo}
                            alt=""
                            className="h-28 w-full rounded-lg border border-border-light object-cover"
                          />
                        ))}
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-text-primary">
                        {tOcc("comments")}
                      </h3>
                      {occ.comments.length === 0 ? (
                        <p className="mt-1 text-xs text-text-secondary">
                          {tOcc("noComments")}
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {occ.comments.map((comment) => (
                            <li
                              key={comment.id}
                              className="rounded-md bg-secondary-50 px-3 py-2 text-sm"
                            >
                              <p className="text-xs text-text-secondary">
                                {comment.author}
                                {comment.createdAt
                                  ? ` · ${day(comment.createdAt)}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-text-primary">
                                {comment.message}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selected &&
                      canPortalComment(
                        selected.role,
                        selected.ownerId,
                        occ.ownerId,
                      ) && (
                        <div className="space-y-2">
                          <textarea
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-border-light px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary-100"
                            placeholder={tOcc("commentPlaceholder")}
                          />
                          {commentError && (
                            <p className="text-sm text-error">{commentError}</p>
                          )}
                          <Button
                            size="sm"
                            iconName="MessageSquare"
                            disabled={commentBusy || !commentDraft.trim()}
                            loading={commentBusy}
                            onClick={() => void handleComment(occ)}
                          >
                            {commentBusy
                              ? tOcc("commenting")
                              : tOcc("addComment")}
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PortalShell>
  );
}
