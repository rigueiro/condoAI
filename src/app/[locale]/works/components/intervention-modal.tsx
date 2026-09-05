"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { todayKey } from "@/lib/collections/dates";
import {
  isAllowedOccurrencePhoto,
  MAX_OCCURRENCE_PHOTOS,
  OCCURRENCE_PHOTO_ACCEPT,
} from "@/lib/occurrences/photos";
import { readFileAsDataUrl } from "@/lib/compliance/files";
import type { AddInterventionInput } from "@/lib/works";
import WorksModal, {
  WORKS_FIELD_CLASS,
  WORKS_LABEL_CLASS,
} from "./works-modal";

function InterventionModal({
  projectId,
  onClose,
  onSave,
}: {
  projectId: string;
  onClose: () => void;
  onSave: (input: AddInterventionInput) => Promise<boolean>;
}) {
  const t = useTranslations("works");
  const [date, setDate] = useState(todayKey());
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handlePhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_OCCURRENCE_PHOTOS) {
      setPhotoError(t("worklog.tooMany"));
      return;
    }
    const next = [...photos];
    for (const file of files) {
      const invalid = isAllowedOccurrencePhoto(file);
      if (invalid === "invalidType") {
        setPhotoError(t("worklog.invalidType"));
        return;
      }
      if (invalid === "tooLarge") {
        setPhotoError(t("worklog.tooLarge"));
        return;
      }
      try {
        next.push(await readFileAsDataUrl(file));
      } catch {
        setPhotoError(t("worklog.invalidType"));
        return;
      }
    }
    setPhotoError(null);
    setPhotos(next);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!description.trim()) {
      next.description = t("worklog.validation.descriptionRequired");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const ok = await onSave({
      projectId,
      date,
      description: description.trim(),
      cost: cost.trim() ? Number(cost) : 0,
      photos,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <WorksModal
      title={t("worklog.add")}
      cancelLabel={t("worklog.cancel")}
      saveLabel={t("worklog.save")}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("worklog.date")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("worklog.description")}</label>
        <textarea
          className={WORKS_FIELD_CLASS}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description}</p>
        )}
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("worklog.cost")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          type="number"
          min="0"
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("worklog.photos")}</label>
        <p className="mb-2 text-xs text-text-secondary">{t("worklog.photoHint")}</p>
        <input
          type="file"
          accept={OCCURRENCE_PHOTO_ACCEPT}
          multiple
          onChange={(e) => void handlePhotos(e)}
          className="text-sm text-text-secondary"
        />
        {photoError && <p className="mt-1 text-sm text-error">{photoError}</p>}
        {photos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.slice(0, 24) + index}
                type="button"
                onClick={() =>
                  setPhotos((current) =>
                    current.filter((_, item) => item !== index),
                  )
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </WorksModal>
  );
}

export default InterventionModal;
