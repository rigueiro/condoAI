"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { useOverlayLock } from "@/hooks/use-overlay-lock";
import { todayKey } from "@/lib/collections/dates";
import {
  BOARD_OFFICES,
  boardErrorKey,
  defaultTermEnd,
  type BoardMandate,
  type BoardOffice,
  type RecordMandateInput,
  type SeatInput,
} from "@/lib/board";
import type { Owner } from "@/types";

const FIELD =
  "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const LABEL = "mb-1 block text-sm font-medium text-text-primary";

type DraftSeat = SeatInput & { key: string };

function seatsFromMandate(mandate: BoardMandate | null): DraftSeat[] {
  if (mandate && mandate.seats.length > 0) {
    return mandate.seats.map((seat) => ({
      key: seat.id,
      ownerId: seat.ownerId,
      office: seat.office,
      canSignSummons: seat.canSignSummons,
    }));
  }
  return [
    {
      key: "pres",
      ownerId: "",
      office: "presidente",
      canSignSummons: true,
    },
    {
      key: "vog",
      ownerId: "",
      office: "vogal",
      canSignSummons: false,
    },
  ];
}

export type MandateModalPrefill = {
  assemblyId?: string | null;
  agendaItemId?: string | null;
  resolutionId?: string | null;
  startsOn?: string;
};

function MandateModal({
  condominiumId,
  owners,
  mandate,
  prefill,
  onClose,
  onSave,
}: {
  condominiumId: string;
  owners: Owner[];
  mandate: BoardMandate | null;
  prefill?: MandateModalPrefill | null;
  onClose: () => void;
  onSave: (
    input: RecordMandateInput,
  ) => Promise<{ ok: true } | { ok: false; code: string }>;
}) {
  const t = useTranslations("board");
  useOverlayLock(true, onClose);

  const editing = Boolean(mandate);
  const defaultStart = mandate?.startsOn ?? prefill?.startsOn ?? todayKey();
  const [startsOn, setStartsOn] = useState(defaultStart);
  const [endsOn, setEndsOn] = useState(
    mandate?.endsOn ?? defaultTermEnd(defaultStart),
  );
  const [seats, setSeats] = useState<DraftSeat[]>(() =>
    seatsFromMandate(mandate),
  );
  const [notes, setNotes] = useState(mandate?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedOwners = useMemo(
    () => new Set(seats.map((seat) => seat.ownerId).filter(Boolean)),
    [seats],
  );

  const updateSeat = (key: string, patch: Partial<DraftSeat>) => {
    setSeats((current) =>
      current.map((seat) => (seat.key === key ? { ...seat, ...patch } : seat)),
    );
  };

  const handleStartChange = (value: string) => {
    setStartsOn(value);
    if (!mandate) setEndsOn(defaultTermEnd(value || todayKey()));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const result = await onSave({
      condominiumId,
      startsOn,
      endsOn,
      seats: seats.map((seat) => ({
        ownerId: seat.ownerId,
        office: seat.office,
        canSignSummons: seat.canSignSummons,
      })),
      assemblyId: mandate?.assemblyId ?? prefill?.assemblyId ?? null,
      agendaItemId: mandate?.agendaItemId ?? prefill?.agendaItemId ?? null,
      resolutionId: mandate?.resolutionId ?? prefill?.resolutionId ?? null,
      notes,
    });
    setSaving(false);
    if (!result.ok) {
      setError(t(`errors.${boardErrorKey(result.code)}`));
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("modal.cancel")}
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {editing ? t("modal.editTitle") : t("modal.recordTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {prefill?.assemblyId && !editing && (
            <p className="text-sm text-text-secondary">
              {t("modal.fromElection")}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={LABEL}>{t("modal.startsOn")}</span>
              <input
                type="date"
                required
                className={FIELD}
                value={startsOn}
                onChange={(event) => handleStartChange(event.target.value)}
              />
            </label>
            <label className="block">
              <span className={LABEL}>{t("modal.endsOn")}</span>
              <input
                type="date"
                required
                className={FIELD}
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-text-secondary">{t("modal.termHint")}</p>

          <div>
            <p className={`${LABEL} mb-2`}>{t("modal.seats")}</p>
            <ul className="space-y-3">
              {seats.map((seat) => (
                <li
                  key={seat.key}
                  className="rounded-lg border border-border-light p-3"
                >
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-secondary">
                        {t("modal.owner")}
                      </span>
                      <select
                        required
                        className={FIELD}
                        value={seat.ownerId}
                        onChange={(event) =>
                          updateSeat(seat.key, { ownerId: event.target.value })
                        }
                      >
                        <option value="">{t("modal.ownerPlaceholder")}</option>
                        {owners.map((owner) => (
                          <option
                            key={owner.id}
                            value={owner.id}
                            disabled={
                              usedOwners.has(owner.id) &&
                              owner.id !== seat.ownerId
                            }
                          >
                            {owner.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-secondary">
                        {t("modal.office")}
                      </span>
                      <select
                        className={FIELD}
                        value={seat.office}
                        onChange={(event) =>
                          updateSeat(seat.key, {
                            office: event.target.value as BoardOffice,
                            canSignSummons:
                              event.target.value === "presidente"
                                ? true
                                : seat.canSignSummons,
                          })
                        }
                      >
                        {BOARD_OFFICES.map((office) => (
                          <option key={office} value={office}>
                            {t(`offices.${office}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={Boolean(seat.canSignSummons)}
                        onChange={(event) =>
                          updateSeat(seat.key, {
                            canSignSummons: event.target.checked,
                          })
                        }
                      />
                      {t("modal.canSign")}
                    </label>
                    {seats.length > 1 && (
                      <button
                        type="button"
                        className="text-sm text-error hover:underline"
                        onClick={() =>
                          setSeats((current) =>
                            current.filter((row) => row.key !== seat.key),
                          )
                        }
                      >
                        {t("modal.removeSeat")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              onClick={() =>
                setSeats((current) => [
                  ...current,
                  {
                    key: crypto.randomUUID(),
                    ownerId: "",
                    office: "vogal",
                    canSignSummons: false,
                  },
                ])
              }
            >
              {t("modal.addSeat")}
            </button>
          </div>

          <label className="block">
            <span className={LABEL}>{t("modal.notes")}</span>
            <textarea
              className={`${FIELD} min-h-20`}
              value={notes}
              placeholder={t("modal.notesPlaceholder")}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-error-100 bg-error-50 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-secondary-50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? t("modal.saving") : t("modal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MandateModal;
