import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import React from "react";
import { useTranslations } from "next-intl";

interface PropertyFilters {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  unitRangeFilter: string;
  onUnitRangeChange: (value: string) => void;
}

function PropertyFilters({
  searchTerm,
  onSearchChange,
  locationFilter,
  onLocationChange,
  unitRangeFilter,
  onUnitRangeChange,
}: PropertyFilters) {
  const t = useTranslations("propertiesManagement.filters");
  const locationOptions = [
    { value: "", label: t("allLocations") },
    { value: "lisboa", label: t("locations.lisboa") },
    { value: "cascais", label: t("locations.cascais") },
    { value: "porto", label: t("locations.porto") },
    { value: "matosinhos", label: t("locations.matosinhos") },
  ];

  const unitRangeOptions = [
    { value: "", label: t("allSizes") },
    { value: "small", label: t("sizes.small") },
    { value: "medium", label: t("sizes.medium") },
    { value: "large", label: t("sizes.large") },
  ];

  const handleClearFilters = () => {
    onSearchChange("");
    onLocationChange("");
    onUnitRangeChange("");
  };

  const hasActiveFilters = searchTerm || locationFilter || unitRangeFilter;

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon
              name="Search"
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Location Filter */}
          <Select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            {locationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Unit Range Filter */}
          <Select
            value={unitRangeFilter}
            onChange={(e) => onUnitRangeChange(e.target.value)}
          >
            {unitRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-secondary-50 rounded-lg transition-smooth"
            >
              <Icon name="X" size={16} />
              <span>{t('clear')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">{t("activeFilters")}</span>

            {searchTerm && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-50 text-primary text-sm rounded-full">
                <span>{t('chipSearch')} {`"${searchTerm}"`}</span>
                <button
                  onClick={() => onSearchChange("")}
                  className="hover:text-primary-700"
                >
                  <Icon name="X" size={14} />
                </button>
              </span>
            )}

            {locationFilter && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-accent-50 text-accent text-sm rounded-full">
                <span>
                  {t('chipLocation')}{" "}
                  {
                    locationOptions.find((opt) => opt.value === locationFilter)
                      ?.label
                  }
                </span>
                <button
                  onClick={() => onLocationChange("")}
                  className="hover:text-accent-700"
                >
                  <Icon name="X" size={14} />
                </button>
              </span>
            )}

            {unitRangeFilter && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-secondary-100 text-secondary-700 text-sm rounded-full">
                <span>
                  {t('chipSize')} 
                  {
                    unitRangeOptions.find(
                      (opt) => opt.value === unitRangeFilter,
                    )?.label
                  }
                </span>
                <button
                  onClick={() => onUnitRangeChange("")}
                  className="hover:text-secondary-800"
                >
                  <Icon name="X" size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyFilters;
