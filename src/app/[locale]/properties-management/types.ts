import type { Condominium } from "@/types";
import type { CondoStats } from "@/lib/portfolio";

export type SortConfig = {
  key:
    | "name"
    | "totalUnits"
    | "collectionRate"
    | "occupiedUnits"
    | "averageFee";
  direction: "asc" | "desc";
};

export type CondoRow = {
  condo: Condominium;
  stats: CondoStats;
};
