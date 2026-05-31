"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Select from "@/components/ui/select";
import {
  OCCURRENCE_CATEGORY_VALUES,
  OCCURRENCE_PRIORITY_VALUES,
  OCCURRENCE_STATE_KEYS,
} from "./occurrence-meta";

export interface OccurrenceFiltersState {
  search: string;
  property: string;
  category: string;
  state: string;
  priority: string;
}

interface Props {
  filters: OccurrenceFiltersState;
  onFiltersChange: React.Dispatch<React.SetStateAction<OccurrenceFiltersState>>;
  properties: { id: string; name: string }[];
}

function OccurrenceFilters({ filters, onFiltersChange, properties }: Props) {
  const t = useTranslations("occurrences.filters");
  const tState = useTranslations("occurrences.states");
  const tCategory = useTranslations("occurrences.categories");
  const tPriority = useTranslations("occurrences.priorities");

  const handleFilterChange = (key: keyof OccurrenceFiltersState, value: string) => {
    onFiltersChange((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      property: "",
      category: "",
      state: "",
      priority: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2 lg:mb-0">
          {t("title")}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-accent hover:text-accent-700 transition-smooth"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative md:col-span-2 lg:col-span-1">
          <Icon
            name="Search"
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary transition-smooth"
          />
        </div>

        <Select
          value={filters.property}
          onChange={(e) => handleFilterChange("property", e.target.value)}
          className="text-ellipsis"
        >
          <option value="">{t("allProperties")}</option>
          {properties.map((property) => (
            <option key={property.id} value={property.name}>
              {property.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="text-ellipsis"
        >
          <option value="">{t("allCategories")}</option>
          {OCCURRENCE_CATEGORY_VALUES.map((category) => (
            <option key={category} value={category}>
              {tCategory(category)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.priority}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
        >
          <option value="">{t("allPriorities")}</option>
          {OCCURRENCE_PRIORITY_VALUES.map((priority) => (
            <option key={priority} value={priority}>
              {tPriority(priority)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.state}
          onChange={(e) => handleFilterChange("state", e.target.value)}
          className="text-ellipsis"
        >
          <option value="">{t("allStates")}</option>
          {OCCURRENCE_STATE_KEYS.map((state) => (
            <option key={state} value={state}>
              {tState(state)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default OccurrenceFilters;
