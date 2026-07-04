import type { SelectedIncentiveAssumption } from "./types";

// Shared, pure display-grouping helpers reused by both the main Dashboard chart adapter and
// the "Your Numbers" card adapter — no formula/math changes, just grouping already-computed
// exposure figures (assumption.estimatedExposureKsh) for presentation.

export function groupExposureByDepartment(assumptions: SelectedIncentiveAssumption[]): Record<string, number> {
  return assumptions.reduce<Record<string, number>>((totals, assumption) => {
    const department = assumption.ruleSnapshot.department;
    totals[department] = (totals[department] ?? 0) + assumption.estimatedExposureKsh;
    return totals;
  }, {});
}

export function computeBonusSalarySplitKsh(assumptions: SelectedIncentiveAssumption[]): {
  bonusExposureKsh: number;
  salaryIncrementExposureKsh: number;
} {
  const bonusExposureKsh = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType !== "Salary Increment")
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  const salaryIncrementExposureKsh = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType === "Salary Increment" || assumption.ruleSnapshot.isPermanentSalaryIncrement)
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  return { bonusExposureKsh, salaryIncrementExposureKsh };
}
