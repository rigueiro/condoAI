"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import type { Assembly, AssemblyType, CreateAssemblyInput } from "@/lib/assemblies";

type CondoOption = { id: string; name: string };

function AssemblyModal({
  assembly,
  condominiums,
  defaultCondominiumId,
  onClose,
  onCreate,
  onSave,
}: {
  assembly: Assembly | null;
  condominiums: CondoOption[];
  defaultCondominiumId?: string;
  onClose: () => void;
  onCreate: (input: CreateAssemblyInput) => Promise<boolean>;
  onSave: (assembly: Assembly) => void;
}) {
  const t = useTranslations("assemblies");
  const isEdit = Boolean(assembly);
  const [condominiumId, setCondominiumId] = useState(
    assembly?.condominiumId ?? defaultCondominiumId ?? condominiums[0]?.id ?? "",
  );
  const [type, setType] = useState<AssemblyType>(
    assembly?.type ?? "ordinary",
  );
  const [title, setTitle] = useState(assembly?.title ?? "");
  const [scheduledDate, setScheduledDate] = useState(
    assembly?.scheduledDate ?? "",
  );
  const [scheduledTime, setScheduledTime] = useState(
    assembly?.scheduledTime ?? "18:30",
  );
  const [location, setLocation] = useState(assembly?.location ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1 block text-sm font-medium text-text-primary";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!condominiumId) next.condominiumId = t("modal.validation.condoRequired");
    if (!title.trim()) next.title = t("modal.validation.titleRequired");
    if (!scheduledDate) next.scheduledDate = t("modal.validation.dateRequired");
    if (!location.trim()) next.location = t("modal.validation.locationRequired");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (isEdit && assembly) {
      onSave({
        ...assembly,
        condominiumId,
        type,
        title: title.trim(),
        scheduledDate,
        scheduledTime,
        location: location.trim(),
      });
      onClose();
      return;
    }

    setBusy(true);
    const ok = await onCreate({
      condominiumId,
      type,
      title: title.trim(),
      scheduledDate,
      scheduledTime,
      location: location.trim(),
    });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("modal.cancel")}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? t("modal.editTitle") : t("modal.addTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className={labelClass}>{t("modal.condominium")}</label>
            <Select
              value={condominiumId}
              onChange={(event) => setCondominiumId(event.target.value)}
              disabled={isEdit}
            >
              {condominiums.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </Select>
            {errors.condominiumId && (
              <p className="mt-1 text-xs text-error">{errors.condominiumId}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>{t("modal.type")}</label>
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as AssemblyType)
              }
              disabled={isEdit && assembly?.status !== "draft"}
            >
              <option value="ordinary">{t("types.ordinary")}</option>
              <option value="extraordinary">{t("types.extraordinary")}</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>{t("modal.title")}</label>
            <input
              className={fieldClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("modal.titlePlaceholder")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-error">{errors.title}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("modal.date")}</label>
              <input
                type="date"
                className={fieldClass}
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-xs text-error">{errors.scheduledDate}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>{t("modal.time")}</label>
              <input
                type="time"
                className={fieldClass}
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t("modal.location")}</label>
            <input
              className={fieldClass}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={t("modal.locationPlaceholder")}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-error">{errors.location}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-secondary-50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {t("modal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssemblyModal;
