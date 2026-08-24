import type { Unit } from "@/types";
import { normalizeOccupancies } from "./occupancy";

export const UNIT_TYPES: Unit["type"][] = [
  "apartment",
  "shop",
  "garage",
  "parking",
  "other",
];

const UNIT_TYPE_SET = new Set<string>(UNIT_TYPES);

export const TOTAL_PERMILLAGE = 1000;
export const PERMILLAGE_TOLERANCE = 0.01;

export type PermillageSummary = {
  allocated: number;
  remaining: number;
  total: number;
  isComplete: boolean;
  isOver: boolean;
  isUnder: boolean;
};

export function isUnitType(value: string): value is Unit["type"] {
  return UNIT_TYPE_SET.has(value);
}

export function parseUnitType(value: string): Unit["type"] {
  const normalized = value.trim().toLowerCase();
  return isUnitType(normalized) ? normalized : "apartment";
}

export function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function roundPermillage(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function sumPermillage(units: Unit[]): number {
  return roundPermillage(
    units.reduce((sum, unit) => sum + (Number(unit.permillage) || 0), 0),
  );
}

export function unitsForCondominium(
  units: Unit[],
  condominiumId: string,
): Unit[] {
  return units.filter((unit) => unit.condominiumId === condominiumId);
}

export function permillageSummary(
  units: Unit[],
  total = TOTAL_PERMILLAGE,
): PermillageSummary {
  const allocated = sumPermillage(units);
  const remaining = roundPermillage(total - allocated);
  return {
    allocated,
    remaining,
    total,
    isComplete: Math.abs(allocated - total) <= PERMILLAGE_TOLERANCE,
    isOver: allocated > total + PERMILLAGE_TOLERANCE,
    isUnder: allocated < total - PERMILLAGE_TOLERANCE,
  };
}

export function formatPermillage(value: number, locale?: string): string {
  return `${value.toLocaleString(locale, {
    maximumFractionDigits: 3,
  })}‰`;
}

export function compareUnits(a: Unit, b: Unit): number {
  const floorCmp = (a.floor ?? "").localeCompare(b.floor ?? "", undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (floorCmp !== 0) return floorCmp;
  return a.label.localeCompare(b.label, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function buildEmptyUnit(condominiumId: string): Unit {
  return {
    id: crypto.randomUUID(),
    condominiumId,
    label: "",
    floor: null,
    permillage: 0,
    type: "apartment",
    areaSqm: null,
    occupancies: [],
  };
}

export function normalizeUnit(unit: Unit): Unit {
  const permillage = roundPermillage(Number(unit.permillage));
  const areaSqm = unit.areaSqm == null ? null : Number(unit.areaSqm);
  return {
    ...unit,
    label: unit.label.trim(),
    floor: unit.floor?.toString().trim() || null,
    permillage: Number.isFinite(permillage) ? permillage : 0,
    type: isUnitType(unit.type) ? unit.type : "apartment",
    areaSqm: areaSqm == null || !Number.isFinite(areaSqm) ? null : areaSqm,
    occupancies: normalizeOccupancies(unit.occupancies),
  };
}
