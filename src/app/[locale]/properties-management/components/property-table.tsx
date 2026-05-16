import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import React from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { Property } from "../types";

interface PropertyTableProps {
  properties: Property[];
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSort: (key: keyof Property) => void;
  selectedProperties: string[];
  onSelectProperty: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

function PropertyTable({
  properties,
  sortConfig,
  onSort,
  selectedProperties,
  onSelectProperty,
  onSelectAll,
  onEdit,
  onDelete,
}: PropertyTableProps) {
  const t = useTranslations("propertiesManagement.table");
  const { formatCurrency, formatPriceString } = useFormatCurrency();
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return (
        <Icon name="ArrowUpDown" size={16} className="text-secondary-400" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <Icon name="ArrowUp" size={16} className="text-primary" />
    ) : (
      <Icon name="ArrowDown" size={16} className="text-primary" />
    );
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return "text-success";
    if (rate >= 90) return "text-warning";
    return "text-error";
  };

  const getCollectionRateBg = (rate: number) => {
    if (rate >= 95) return "bg-success-50";
    if (rate >= 90) return "bg-warning-50";
    return "bg-error-50";
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50 border-b border-border-light">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedProperties.length === properties.length &&
                    properties.length > 0
                  }
                  onChange={onSelectAll}
                  className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary focus:ring-2"
                />
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-secondary-100 transition-smooth"
                onClick={() => onSort("name")}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('name')}</span>
                  {getSortIcon("name")}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                {t('address')}
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-secondary-100 transition-smooth"
                onClick={() => onSort("totalUnits")}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('units')}</span>
                  {getSortIcon("totalUnits")}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">
                {t('monthlyFeeRange')}
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-secondary-100 transition-smooth"
                onClick={() => onSort("collectionRate")}
              >
                <div className="flex items-center space-x-2">
                  <span>{t('collectionRate')}</span>
                  {getSortIcon("collectionRate")}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-medium text-text-primary">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {properties.map((property) => (
              <tr
                key={property.id}
                className="hover:bg-secondary-50 transition-smooth"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProperties.includes(
                      property.id.toString(),
                    )}
                    onChange={() => onSelectProperty(property.id.toString())}
                    className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary focus:ring-2"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <Link
                      href={`/properties-management/${property.id}`}
                      className="font-medium text-text-primary hover:text-primary hover:underline transition-smooth"
                    >
                      {property.name}
                    </Link>
                    <div className="text-sm text-text-secondary">
                      {property.buildingType} • {t('built', { year: property.yearBuilt })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className="text-sm text-text-primary max-w-xs truncate"
                    title={property.address}
                  >
                    {property.address}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">
                    <span className="font-medium">
                      {property.occupiedUnits}
                    </span>
                    <span className="text-text-secondary">
                      /{property.totalUnits}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {t("occupied", {
                      percent: Math.round(
                        (property.occupiedUnits / property.totalUnits) * 100,
                      ),
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary font-medium">
                    {formatPriceString(property.monthlyFeeRange)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {t("avgFee", { amount: formatCurrency(property.averageFee) })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCollectionRateBg(property.collectionRate)} ${getCollectionRateColor(property.collectionRate)}`}
                  >
                    {property.collectionRate}%
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(property)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-smooth"
                      title={t('editProperty')}
                    >
                      <Icon name="Edit" size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(property.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-error-50 rounded-lg transition-smooth"
                      title={t('deleteProperty')}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden">
        {properties.map((property) => (
          <div
            key={property.id}
            className="p-6 border-b border-border-light last:border-b-0"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(property.id.toString())}
                  onChange={() => onSelectProperty(property.id.toString())}
                  className="w-4 h-4 text-primary border-secondary-300 rounded focus:ring-primary focus:ring-2 mt-1"
                />
                <div>
                  <Link
                    href={`/properties-management/${property.id}`}
                    className="font-medium text-text-primary hover:text-primary hover:underline transition-smooth mb-1 block"
                  >
                    {property.name}
                  </Link>
                  <p className="text-sm text-text-secondary mb-2">
                    {property.buildingType} • {t('built', { year: property.yearBuilt })}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {property.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(property)}
                  className="p-2 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-smooth"
                >
                  <Icon name="Edit" size={16} />
                </button>
                <button
                  onClick={() => onDelete(property.id)}
                  className="p-2 text-text-secondary hover:text-error hover:bg-error-50 rounded-lg transition-smooth"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">{t('unitsLabel')}</span>
                <span className="ml-2 font-medium text-text-primary">
                  {property.occupiedUnits}/{property.totalUnits}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">{t('feeRange')}</span>
                <span className="ml-2 font-medium text-text-primary">
                  {formatPriceString(property.monthlyFeeRange)}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">{t('occupancy')}</span>
                <span className="ml-2 font-medium text-text-primary">
                  {Math.round(
                    (property.occupiedUnits / property.totalUnits) * 100,
                  )}
                  %
                </span>
              </div>
              <div>
                <span className="text-text-secondary">{t('collection')}</span>
                <span
                  className={`ml-2 font-medium ${getCollectionRateColor(property.collectionRate)}`}
                >
                  {property.collectionRate}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Icon
            name="Building2"
            size={48}
            className="text-secondary-300 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {t('noResults')}
          </h3>
          <p className="text-text-secondary">
            {t('emptyHint')}
          </p>
        </div>
      )}
    </div>
  );
}

export default PropertyTable;
