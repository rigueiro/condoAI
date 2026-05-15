import Icon from "@/components/icon";
import React from "react";
import { useTranslations } from "next-intl";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onClearSelection: () => void;
}

function BulkActionsBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onClearSelection,
}: BulkActionsBarProps) {
  const t = useTranslations("propertiesManagement.bulk");
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="text-sm font-medium text-primary">
              {selectedCount === 1 ? t('selected', { count: selectedCount }) : t('selectedPlural', { count: selectedCount })}
            </span>
          </div>

          <button
            onClick={onClearSelection}
            className="text-sm text-text-secondary hover:text-text-primary transition-smooth"
          >
            {t('clearSelection')}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onBulkExport}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-surface text-text-primary border border-border-medium rounded-lg hover:bg-secondary-50 transition-smooth"
          >
            <Icon name="Download" size={16} />
            <span>{t('export')}</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-red-700 transition-smooth"
          >
            <Icon name="Trash2" size={16} />
            <span>{t('delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionsBar;
