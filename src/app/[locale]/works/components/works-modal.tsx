"use client";

import type { FormEvent, ReactNode } from "react";
import Icon from "@/components/icon";
import { useOverlayLock } from "@/hooks/use-overlay-lock";

export const WORKS_FIELD_CLASS =
  "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
export const WORKS_LABEL_CLASS = "mb-1 block text-sm font-medium text-text-primary";

function WorksModal({
  title,
  cancelLabel,
  saveLabel,
  saving,
  saveDisabled,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  cancelLabel: string;
  saveLabel: string;
  saving: boolean;
  saveDisabled?: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  useOverlayLock(true, onClose);

  return (
    <div className="fixed inset-0 z-1001 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={cancelLabel}
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-light bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
          {children}
          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-secondary-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={saving || saveDisabled}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WorksModal;
