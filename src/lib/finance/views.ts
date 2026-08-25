import type { AnnualBudget, Condominium } from "@/types";
import { summarizeBudget } from "./budget";
import type { DraftBudgetItem } from "./types";

export function buildDraftBudgetItems(
  budgets: AnnualBudget[],
  condominiums: Condominium[],
): DraftBudgetItem[] {
  const nameById = new Map(condominiums.map((c) => [c.id, c.name]));

  return budgets
    .filter((b) => b.status === "draft")
    .map((b) => {
      const summary = summarizeBudget(b);
      return {
        id: b.id,
        condominiumId: b.condominiumId,
        condominiumName: nameById.get(b.condominiumId) ?? b.condominiumId,
        year: b.year,
        total: summary.collectable,
        categoryCount: Object.keys(summary.ordinary).length,
        reserveShortfall: summary.shortfall,
      };
    })
    .sort(
      (a, b) =>
        a.year - b.year || a.condominiumName.localeCompare(b.condominiumName),
    );
}
