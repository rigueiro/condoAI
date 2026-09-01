"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { OCCURRENCE_CATEGORY_VALUES } from "@/app/[locale]/occurrences/components/occurrence-meta";
import { apiFetch } from "@/lib/api/client";
import { readFileAsDataUrl } from "@/lib/compliance/files";
import type { PortalMembershipView, PortalOccurrence } from "@/lib/memberships";
import {
  isAllowedOccurrencePhoto,
  MAX_OCCURRENCE_PHOTOS,
  OCCURRENCE_PHOTO_ACCEPT,
} from "@/lib/occurrences/photos";

const COMMON_UNIT = "__common__";

const PHOTO_ERROR_KEY = {
  invalidType: "photosInvalidType",
  tooLarge: "photosTooLarge",
  tooMany: "photosTooMany",
} as const;

type Props = {
  membership: PortalMembershipView;
  onClose: () => void;
  onCreated: (occurrence: PortalOccurrence) => void;
};

export default function PortalSubmitOccurrenceForm({
  membership,
  onClose,
  onCreated,
}: Props) {
  const t = useTranslations("portal.occurrences");
  const tCategory = useTranslations("occurrences.categories");
  const fileRef = useRef<HTMLInputElement>(null);
  const unitLabels = membership.unitLabels;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(OCCURRENCE_CATEGORY_VALUES[0]);
  const [unitChoice, setUnitChoice] = useState(unitLabels[0] ?? COMMON_UNIT);
  const [unitOther, setUnitOther] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showUnitOther = unitChoice === COMMON_UNIT || unitLabels.length === 0;
  const resolvedUnit =
    unitLabels.length > 0 && unitChoice !== COMMON_UNIT
      ? unitChoice
      : unitOther.trim();

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-4 py-2 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary-100 ${
      hasError ? "border-error" : "border-border-light"
    }`;

  const handlePhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const next = [...photos];
    let error: string | null = null;
    for (const file of files) {
      if (next.length >= MAX_OCCURRENCE_PHOTOS) {
        error = t(PHOTO_ERROR_KEY.tooMany, { max: MAX_OCCURRENCE_PHOTOS });
        break;
      }
      const invalid = isAllowedOccurrencePhoto(file);
      if (invalid) {
        error = t(PHOTO_ERROR_KEY[invalid]);
        continue;
      }
      try {
        next.push(await readFileAsDataUrl(file));
      } catch {
        error = t("photosReadFailed");
      }
    }
    setPhotoError(error);
    setPhotos(next);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("titleRequired");
    if (!description.trim()) nextErrors.description = t("descriptionRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const result = await apiFetch<{ occurrence: PortalOccurrence }>(
        "/api/portal/occurrences",
        {
          method: "POST",
          body: JSON.stringify({
            condominiumId: membership.condominiumId,
            title: title.trim(),
            description: description.trim(),
            category,
            unit: resolvedUnit || null,
            photos,
          }),
        },
      );
      onCreated(result.occurrence);
    } catch {
      setSubmitError(t("submitFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-border-light p-5">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("submitTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t("fieldTitle")} *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass(Boolean(errors.title))}
              placeholder={t("titlePlaceholder")}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-error">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t("fieldDescription")} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass(Boolean(errors.description))}
              placeholder={t("descriptionPlaceholder")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                {t("fieldCategory")} *
              </label>
              <Select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as (typeof OCCURRENCE_CATEGORY_VALUES)[number],
                  )
                }
              >
                {OCCURRENCE_CATEGORY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {tCategory(value)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                {t("fieldUnit")}
              </label>
              {unitLabels.length > 0 ? (
                <Select
                  value={unitChoice}
                  onChange={(e) => setUnitChoice(e.target.value)}
                >
                  {unitLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                  <option value={COMMON_UNIT}>{t("commonArea")}</option>
                </Select>
              ) : (
                <input
                  value={unitOther}
                  onChange={(e) => setUnitOther(e.target.value)}
                  className={inputClass(false)}
                  placeholder={t("unitPlaceholder")}
                />
              )}
            </div>
          </div>

          {unitLabels.length > 0 && showUnitOther && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                {t("fieldUnitOther")}
              </label>
              <input
                value={unitOther}
                onChange={(e) => setUnitOther(e.target.value)}
                className={inputClass(false)}
                placeholder={t("unitPlaceholder")}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t("fieldPhotos")}
            </label>
            <p className="mb-2 text-xs text-text-secondary">
              {t("photosHint", { max: MAX_OCCURRENCE_PHOTOS })}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={OCCURRENCE_PHOTO_ACCEPT}
              multiple
              className="hidden"
              onChange={handlePhotos}
            />
            <Button
              type="button"
              variant="outline"
              iconName="Image"
              onClick={() => fileRef.current?.click()}
              disabled={photos.length >= MAX_OCCURRENCE_PHOTOS}
            >
              {t("addPhotos")}
            </Button>
            {photoError && (
              <p className="mt-2 text-sm text-error">{photoError}</p>
            )}
            {photos.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <li key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt=""
                      className="h-20 w-full rounded-lg border border-border-light object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      aria-label={t("removePhoto")}
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {submitError && <p className="text-sm text-error">{submitError}</p>}

          <div className="flex justify-end gap-3 border-t border-border-light pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" iconName="Send" loading={saving}>
              {saving ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
