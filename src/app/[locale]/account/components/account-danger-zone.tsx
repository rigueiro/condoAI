"use client";

import React, { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";

interface AccountDangerZoneProps {
  organizationName: string;
  onConfirmDelete?: () => Promise<void> | void;
  onTransferOwnership?: () => void;
}

function AccountDangerZone({
  organizationName,
  onConfirmDelete,
  onTransferOwnership,
}: AccountDangerZoneProps) {
  const t = useTranslations("account.dangerZone");
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setOpen(false);
    setConfirmation("");
  }, [isDeleting]);

  const handleConfirm = useCallback(async () => {
    if (confirmation !== organizationName) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete?.();
      setOpen(false);
      setConfirmation("");
    } finally {
      setIsDeleting(false);
    }
  }, [confirmation, organizationName, onConfirmDelete]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-text-primary">
            {t("transferOwnership")}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {t("transferOwnershipDesc")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          iconName="ArrowRightLeft"
          onClick={onTransferOwnership}
        >
          {t("transfer")}
        </Button>
      </div>

      <div className="pt-6 border-t border-error-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-error">
            {t("deleteAccount")}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {t("deleteAccountDesc")}
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          iconName="Trash2"
          onClick={() => setOpen(true)}
        >
          {t("delete")}
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-1001 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-error-50 flex items-center justify-center flex-shrink-0">
                <Icon
                  name="AlertTriangle"
                  size={20}
                  color="var(--color-error)"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary">
                  {t("confirmTitle")}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {t("confirmDesc")}
                </p>
              </div>
            </div>

            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={organizationName}
              disabled={isDeleting}
              className="mt-4 w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-error focus:border-transparent disabled:opacity-60"
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isDeleting}
                disabled={confirmation !== organizationName || isDeleting}
                onClick={handleConfirm}
              >
                {t("confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountDangerZone;
