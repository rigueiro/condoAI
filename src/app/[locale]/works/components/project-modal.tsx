"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/select";
import {
  WORKS_CATEGORIES,
  type CreateWorksProjectInput,
  type WorksCategory,
  type WorksProject,
} from "@/lib/works";
import WorksModal, {
  WORKS_FIELD_CLASS,
  WORKS_LABEL_CLASS,
} from "./works-modal";

function ProjectModal({
  project,
  condominiums,
  defaultCondominiumId,
  onClose,
  onSave,
}: {
  project: WorksProject | null;
  condominiums: { id: string; name: string }[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onSave: (input: CreateWorksProjectInput & { id?: string }) => Promise<boolean>;
}) {
  const t = useTranslations("works");
  const [condominiumId, setCondominiumId] = useState(
    project?.condominiumId ?? defaultCondominiumId ?? condominiums[0]?.id ?? "",
  );
  const [title, setTitle] = useState(project?.title ?? "");
  const [category, setCategory] = useState<WorksCategory>(
    project?.category ?? "other",
  );
  const [location, setLocation] = useState(project?.location ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!condominiumId) next.condominiumId = t("modal.validation.condominiumRequired");
    if (!title.trim()) next.title = t("modal.validation.titleRequired");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const ok = await onSave({
      id: project?.id,
      condominiumId,
      title: title.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      notes: notes.trim(),
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <WorksModal
      title={project ? t("modal.editTitle") : t("modal.addTitle")}
      cancelLabel={t("modal.cancel")}
      saveLabel={t("modal.save")}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.condominium")}</label>
        <Select
          value={condominiumId}
          onChange={(e) => setCondominiumId(e.target.value)}
          disabled={Boolean(project)}
          invalid={Boolean(errors.condominiumId)}
        >
          {condominiums.map((condo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name}
            </option>
          ))}
        </Select>
        {errors.condominiumId && (
          <p className="mt-1 text-sm text-error">{errors.condominiumId}</p>
        )}
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.title")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("modal.titlePlaceholder")}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-error">{errors.title}</p>
        )}
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.category")}</label>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as WorksCategory)}
        >
          {WORKS_CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {t(`categories.${key}`)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.location")}</label>
        <input
          className={WORKS_FIELD_CLASS}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("modal.locationPlaceholder")}
        />
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.description")}</label>
        <textarea
          className={WORKS_FIELD_CLASS}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className={WORKS_LABEL_CLASS}>{t("modal.notes")}</label>
        <textarea
          className={WORKS_FIELD_CLASS}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </WorksModal>
  );
}

export default ProjectModal;
