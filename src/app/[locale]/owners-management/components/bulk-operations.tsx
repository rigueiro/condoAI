"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

interface Props {
  selectedCount: number;
  onClearSelection: () => void;
}

function BulkOperations({ selectedCount, onClearSelection }: Props) {
  const t = useTranslations("ownersManagement.bulk");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleBulkAction = (action: string) => {
    console.log(`Performing bulk action: ${action} on ${selectedCount} owners`);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="CheckSquare" size={20} className="text-primary" />
          <span className="text-sm font-medium text-primary">
            {t("selected", { count: selectedCount })}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-smooth"
            >
              <Icon name="MoreHorizontal" size={16} />
              <span>{t("bulkActions")}</span>
              <Icon name="ChevronDown" size={16} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-modal border border-border-light z-10">
                <div className="py-2">
                  <button
                    onClick={() => handleBulkAction("send-reminders")}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
                  >
                    <Icon name="Mail" size={16} />
                    <span>{t("sendReminders")}</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("export")}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
                  >
                    <Icon name="Download" size={16} />
                    <span>{t("exportSelected")}</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("update-fees")}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 transition-smooth"
                  >
                    <Icon name="DollarSign" size={16} />
                    <span>{t("updateFees")}</span>
                  </button>
                  <div className="border-t border-border-light my-1"></div>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-error hover:bg-error-50 transition-smooth"
                  >
                    <Icon name="Trash2" size={16} />
                    <span>{t("deleteSelected")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClearSelection}
            className="inline-flex items-center space-x-2 bg-secondary-100 text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-200 transition-smooth"
          >
            <Icon name="X" size={16} />
            <span>{t("clear")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkOperations;
