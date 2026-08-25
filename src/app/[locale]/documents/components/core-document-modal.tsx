"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type { Condominium } from "@/types";
import DocumentUpload from "@/app/[locale]/compliance/components/document-upload";

function CoreDocumentModal({
  condominium,
  kind,
  onClose,
  onSave,
}: {
  condominium: Condominium;
  kind: "constitutive-title" | "internal-regulations";
  onClose: () => void;
  onSave: (condominium: Condominium) => void;
}) {
  const t = useTranslations("documents.modal");
  const tKinds = useTranslations("documents.kinds");
  const [titleFile, setTitleFile] = useState(condominium.constitutiveTitle);
  const [regsVersion, setRegsVersion] = useState(
    condominium.internalRegulations.version,
  );
  const [regsDate, setRegsDate] = useState(
    String(condominium.internalRegulations.date).slice(0, 10),
  );
  const [regsFile, setRegsFile] = useState(
    condominium.internalRegulations.file,
  );

  const kindLabel = tKinds(kind);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...condominium,
      constitutiveTitle: kind === "constitutive-title" ? titleFile : condominium.constitutiveTitle,
      internalRegulations:
        kind === "internal-regulations"
          ? {
              version: regsVersion.trim(),
              date: regsDate,
              file: regsFile,
            }
          : condominium.internalRegulations,
    });
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-1030 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-border-light p-6">
          <h2 className="text-xl font-semibold text-text-primary">
            {t("editTitle", { kind: kindLabel })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-smooth hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-140px)] overflow-y-auto p-6"
        >
          <p className="mb-4 text-sm text-text-secondary">
            {condominium.name}
          </p>

          {kind === "constitutive-title" ? (
            <DocumentUpload
              label={t("fileLabel")}
              value={titleFile}
              onChange={setTitleFile}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  {t("regsVersion")}
                </label>
                <input
                  type="text"
                  value={regsVersion}
                  onChange={(e) => setRegsVersion(e.target.value)}
                  className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  {t("regsDate")}
                </label>
                <input
                  type="date"
                  value={regsDate}
                  onChange={(e) => setRegsDate(e.target.value)}
                  className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <DocumentUpload
                label={t("fileLabel")}
                value={regsFile}
                onChange={setRegsFile}
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CoreDocumentModal;
