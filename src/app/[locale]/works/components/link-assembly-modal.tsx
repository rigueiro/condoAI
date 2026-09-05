"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/select";
import type { Assembly } from "@/lib/assemblies";
import type { LinkAssemblyInput } from "@/lib/works";
import WorksModal, { WORKS_LABEL_CLASS } from "./works-modal";

function LinkAssemblyModal({
  projectId,
  assemblies,
  onClose,
  onSave,
}: {
  projectId: string;
  assemblies: Assembly[];
  onClose: () => void;
  onSave: (input: LinkAssemblyInput) => Promise<boolean>;
}) {
  const t = useTranslations("works");
  const [assemblyId, setAssemblyId] = useState(assemblies[0]?.id ?? "");
  const [agendaItemId, setAgendaItemId] = useState(
    assemblies[0]?.agenda[0]?.id ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => assemblies.find((row) => row.id === assemblyId) ?? null,
    [assemblies, assemblyId],
  );

  const handleAssemblyChange = (id: string) => {
    setAssemblyId(id);
    const next = assemblies.find((row) => row.id === id);
    setAgendaItemId(next?.agenda[0]?.id ?? "");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!assemblyId) next.assemblyId = t("assembly.validation.assemblyRequired");
    if (!agendaItemId) next.agendaItemId = t("assembly.validation.agendaRequired");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    const ok = await onSave({ projectId, assemblyId, agendaItemId });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <WorksModal
      title={t("assembly.link")}
      cancelLabel={t("assembly.cancel")}
      saveLabel={t("assembly.save")}
      saving={saving}
      saveDisabled={assemblies.length === 0}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {assemblies.length === 0 ? (
        <p className="text-sm text-text-secondary">{t("assembly.noAssemblies")}</p>
      ) : (
        <>
          <div>
            <label className={WORKS_LABEL_CLASS}>{t("assembly.assembly")}</label>
            <Select
              value={assemblyId}
              onChange={(e) => handleAssemblyChange(e.target.value)}
            >
              <option value="">{t("assembly.emptyAssembly")}</option>
              {assemblies.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.title}
                </option>
              ))}
            </Select>
            {errors.assemblyId && (
              <p className="mt-1 text-sm text-error">{errors.assemblyId}</p>
            )}
          </div>
          <div>
            <label className={WORKS_LABEL_CLASS}>{t("assembly.agendaItem")}</label>
            <Select
              value={agendaItemId}
              onChange={(e) => setAgendaItemId(e.target.value)}
              disabled={!selected}
            >
              <option value="">{t("assembly.emptyItem")}</option>
              {selected?.agenda.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.order}. {item.title}
                </option>
              ))}
            </Select>
            {errors.agendaItemId && (
              <p className="mt-1 text-sm text-error">{errors.agendaItemId}</p>
            )}
          </div>
        </>
      )}
    </WorksModal>
  );
}

export default LinkAssemblyModal;
