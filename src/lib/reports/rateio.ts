import type { AnnualBudget, Condominium, Owner, Unit } from "@/types";
import { calculateMonthlyQuota, roundCurrency } from "@/lib/quota";
import { summarizeBudget } from "@/lib/finance/budget";
import {
  compareUnits,
  indexOccupantsByUnitId,
  permillageSummary,
  unitsForCondominium,
} from "@/lib/portfolio";
import { pickBudget } from "./budget";
import type { RateioReport, RateioRow } from "./types";

export function buildRateioReport(input: {
  condominium: Condominium;
  units: Unit[];
  owners: Owner[];
  budgets: AnnualBudget[];
  year: number;
}): RateioReport {
  const { condominium, owners, budgets, year } = input;
  const units = unitsForCondominium(input.units, condominium.id).sort(
    compareUnits,
  );
  const budget = pickBudget(budgets, condominium.id, year);
  const summary = budget
    ? summarizeBudget(budget)
    : { collectable: 0, monthlyTotal: 0 };
  const totalPermillage = condominium.totalPermillage || 1000;
  const permillage = permillageSummary(units, totalPermillage);
  const occupantsByUnit = indexOccupantsByUnitId(units, owners);

  let monthlySum = 0;
  let annualSum = 0;
  const rows: RateioRow[] = units.map((unit) => {
    const unitPermillage = Number(unit.permillage) || 0;
    const monthlyQuota = calculateMonthlyQuota(
      summary.collectable,
      unitPermillage,
      totalPermillage,
    );
    const annualShare = roundCurrency(monthlyQuota * 12);
    monthlySum = roundCurrency(monthlySum + monthlyQuota);
    annualSum = roundCurrency(annualSum + annualShare);

    const occupants = occupantsByUnit.get(unit.id) ?? [];
    const ownersOnly = occupants.filter((o) => o.role === "owner");
    const named = (ownersOnly.length > 0 ? ownersOnly : occupants).map(
      (o) => o.owner.fullName,
    );

    return {
      unitId: unit.id,
      unitLabel: unit.label,
      unitType: unit.type,
      floor: unit.floor,
      permillage: unitPermillage,
      ownerNames: named,
      monthlyQuota,
      annualShare,
      sharePercent:
        totalPermillage > 0
          ? roundCurrency((unitPermillage / totalPermillage) * 100)
          : 0,
    };
  });

  return {
    condominiumId: condominium.id,
    condominiumName: condominium.name,
    year,
    budgetStatus: budget?.status ?? null,
    collectable: summary.collectable,
    monthlyTotal: summary.monthlyTotal,
    totalPermillage,
    allocatedPermillage: permillage.allocated,
    totals: {
      monthly: monthlySum,
      annual: annualSum,
      permillage: permillage.allocated,
    },
    rows,
  };
}
