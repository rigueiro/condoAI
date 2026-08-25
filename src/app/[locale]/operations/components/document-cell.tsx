"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import {
  operationsFileLabel,
  openOperationsDocument,
} from "@/lib/operations/files";

function DocumentCell({ value }: { value: string | null }) {
  const t = useTranslations("operations.table");
  const label = operationsFileLabel(value);

  if (!value || !label) {
    return (
      <td className="px-4 py-3 text-text-secondary">{t("noFile")}</td>
    );
  }

  return (
    <td className="px-4 py-3">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        onClick={() => openOperationsDocument(value)}
      >
        <Icon name="Paperclip" size={14} />
        {t("viewFile", { type: label })}
      </button>
    </td>
  );
}

export default DocumentCell;
