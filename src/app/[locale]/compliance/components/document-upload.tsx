"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import {
  COMPLIANCE_FILE_ACCEPT,
  complianceFileLabel,
  isAllowedComplianceFile,
  openComplianceDocument,
  readFileAsDataUrl,
} from "@/lib/compliance/files";

function DocumentUpload({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  label: string;
}) {
  const t = useTranslations("compliance.modal.file");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = isAllowedComplianceFile(file);
    if (validation === "invalidType") {
      setError(t("invalidType"));
      return;
    }
    if (validation === "tooLarge") {
      setError(t("tooLarge"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError(t("readFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  const handleOpen = () => {
    if (!value) return;
    openComplianceDocument(value);
  };

  const attachedLabel = complianceFileLabel(value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-primary">
        {label}
      </label>
      <p className="mb-2 text-xs text-text-secondary">{t("hint")}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          iconName="Upload"
          onClick={handlePick}
          disabled={busy}
        >
          {value ? t("replace") : t("upload")}
        </Button>
        {value && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="ExternalLink"
              onClick={handleOpen}
            >
              {t("view")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="Trash2"
              onClick={handleRemove}
              className="text-error hover:text-error"
            >
              {t("remove")}
            </Button>
          </>
        )}
      </div>

      {value && attachedLabel && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary">
          <Icon name="Paperclip" size={14} />
          <span>{t("attached", { type: attachedLabel })}</span>
        </p>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-error">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={COMPLIANCE_FILE_ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export default DocumentUpload;
