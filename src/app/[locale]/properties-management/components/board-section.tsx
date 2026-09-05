"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { formatIsoDate } from "@/lib/collections/dates";
import {
  EXPIRING_SOON_DAYS,
  boardEligibleOwners,
  currentMandate,
  daysUntil,
  defaultSigner,
  isMandateOpen,
  mandatesForCondominium,
  mandateStatus,
  presidenteSeat,
  sortedSeats,
  statusTone,
  useBoard,
  type BoardMandate,
} from "@/lib/board";
import { useAssemblies } from "@/lib/assemblies";
import { usePortfolio } from "@/lib/portfolio";
import MandateModal, { type MandateModalPrefill } from "./mandate-modal";

function BoardSection({
  condominiumId,
  prefill,
}: {
  condominiumId: string;
  prefill?: MandateModalPrefill | null;
}) {
  const t = useTranslations("board");
  const locale = useLocale();
  const { portfolio } = usePortfolio();
  const { assemblies } = useAssemblies();
  const { mandates, recordMandate, updateMandate, removeMandate } = useBoard();
  const [modalOpen, setModalOpen] = useState(Boolean(prefill?.assemblyId));
  const [editing, setEditing] = useState<BoardMandate | null>(null);

  const owners = useMemo(
    () =>
      boardEligibleOwners(portfolio.units, portfolio.owners, condominiumId),
    [condominiumId, portfolio.owners, portfolio.units],
  );

  const condoMandates = useMemo(
    () => mandatesForCondominium(mandates, condominiumId),
    [condominiumId, mandates],
  );
  const current = currentMandate(mandates, condominiumId);
  const history = condoMandates.filter((row) => row.id !== current?.id);
  const names = useMemo(
    () => new Map(portfolio.owners.map((owner) => [owner.id, owner.fullName])),
    [portfolio.owners],
  );

  const linkedAssemblyTitle = current?.assemblyId
    ? (assemblies.find((row) => row.id === current.assemblyId)?.title ?? null)
    : null;

  const remaining = current ? daysUntil(current.endsOn) : null;
  const currentStatus = current ? mandateStatus(current) : null;
  const signer = current ? defaultSigner(current) : null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t("record")}
        </Button>
      </div>

      {!current ? (
        <div className="rounded-lg border border-border-light bg-surface p-8 text-center">
          <Icon
            name="Users"
            size={40}
            className="mx-auto mb-2 text-secondary-300"
          />
          <p className="font-medium text-text-primary">{t("empty")}</p>
          <p className="mt-1 text-sm text-text-secondary">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border-light bg-surface p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase text-text-secondary">
                {t("current")} · {current.number}
              </p>
              <p className="mt-1 text-lg font-semibold text-text-primary">
                {t("term", {
                  start: formatIsoDate(current.startsOn, locale),
                  end: formatIsoDate(current.endsOn, locale),
                })}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(currentStatus ?? "active")}`}
            >
              {t(`statuses.${currentStatus ?? "active"}`)}
            </span>
          </div>

          {currentStatus === "expired" && (
            <p className="mb-3 text-sm text-warning">{t("expired")}</p>
          )}
          {currentStatus === "upcoming" && (
            <p className="mb-3 text-sm text-primary">
              {t("upcoming", { date: formatIsoDate(current.startsOn, locale) })}
            </p>
          )}
          {currentStatus === "active" &&
            remaining != null &&
            remaining <= EXPIRING_SOON_DAYS && (
              <p className="mb-3 text-sm text-warning">
                {t("expiring", { days: Math.max(0, remaining) })}
              </p>
            )}

          <ul className="divide-y divide-border-light rounded-lg border border-border-light">
            {sortedSeats(current.seats).map((seat) => (
              <li
                key={seat.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {names.get(seat.ownerId) ?? seat.ownerId}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {t(`offices.${seat.office}`)}
                  </p>
                </div>
                {seat.canSignSummons && (
                  <span className="text-xs font-medium text-primary">
                    {t("signer")}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm text-text-secondary">
            {signer
              ? `${t("signer")}: ${names.get(signer.ownerId) ?? signer.ownerId}`
              : t("noSigner")}
          </p>

          {linkedAssemblyTitle && current.assemblyId && (
            <Link
              href={`/assemblies/${current.assemblyId}`}
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              {t("assemblyLink", { title: linkedAssemblyTitle })}
            </Link>
          )}

          <p className="mt-4 text-xs text-text-secondary">{t("accessHint")}</p>

          {isMandateOpen(current) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(current);
                  setModalOpen(true);
                }}
              >
                {t("edit")}
              </Button>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            {t("history")}
          </h3>
          <ul className="divide-y divide-border-light overflow-hidden rounded-lg border border-border-light bg-surface">
            {history.map((row) => {
              const status = mandateStatus(row);
              const presidente = presidenteSeat(row);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {row.number} ·{" "}
                      {t("term", {
                        start: formatIsoDate(row.startsOn, locale),
                        end: formatIsoDate(row.endsOn, locale),
                      })}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {presidente
                        ? (names.get(presidente.ownerId) ?? presidente.ownerId)
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(status)}`}
                    >
                      {t(`statuses.${status}`)}
                    </span>
                    {status !== "superseded" && (
                      <button
                        type="button"
                        className="text-xs text-error hover:underline"
                        onClick={() => {
                          if (window.confirm(t("confirmDelete"))) {
                            void removeMandate(row.id);
                          }
                        }}
                      >
                        {t("modal.removeSeat")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modalOpen && (
        <MandateModal
          condominiumId={condominiumId}
          owners={owners}
          mandate={editing}
          prefill={editing ? null : prefill}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={async (input) => {
            if (editing) {
              return updateMandate({
                id: editing.id,
                startsOn: input.startsOn,
                endsOn: input.endsOn,
                seats: input.seats,
                notes: input.notes,
              });
            }
            return recordMandate(input);
          }}
        />
      )}
    </section>
  );
}

export default BoardSection;
