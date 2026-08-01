/** Monthly quota from annual budget total and unit permillage (‰ of 1000). */
export function calculateMonthlyQuota(
  annualBudgetTotal: number,
  unitPermillage: number,
  totalPermillage = 1000,
): number {
  if (totalPermillage <= 0) return 0;
  const monthlyBudget = annualBudgetTotal / 12;
  return roundCurrency(monthlyBudget * (unitPermillage / totalPermillage));
}

export function sumBudgetCategories(
  valuesByCategory: Record<string, number>,
): number {
  return Object.values(valuesByCategory).reduce((sum, value) => sum + value, 0);
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
