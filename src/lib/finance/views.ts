import type { AnnualBudget, Condominium } from "@/types";
import { sumBudgetCategories } from "@/lib/quota";
import type { DraftBudgetItem } from "./types";

export function buildDraftBudgetItems(
  budgets: AnnualBudget[],
  condominiums: Condominium[],
): DraftBudgetItem[] {
  const nameById = new Map(condominiums.map((c) => [c.id, c.name]));

  return budgets
    .filter((b) => b.status === "draft")
    .map((b) => ({
      id: b.id,
      condominiumId: b.condominiumId,
      condominiumName: nameById.get(b.condominiumId) ?? b.condominiumId,
      year: b.year,
      total: sumBudgetCategories(b.valuesByCategory),
      categoryCount: Object.keys(b.valuesByCategory).length,
    }))
    .sort(
      (a, b) =>
        a.year - b.year || a.condominiumName.localeCompare(b.condominiumName),
    );
}
