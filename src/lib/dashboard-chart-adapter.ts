import { fromKsh, isFiniteNumber } from "./currency";
import { computeBonusSalarySplitKsh, groupExposureByDepartment } from "./dashboard-groupings";
import type { CurrencyCode, SelectedIncentiveAssumption, SimulationResults } from "./types";

// Neutral "balanced" placeholder value shown before any Dashboard variable has been entered.
// This is a visual-only stand-in — isPlaceholder marks it so the UI never formats it as money.
const PLACEHOLDER_VALUE = 50;

export type DashboardChartData =
  | { kind: "line"; labels: string[]; series: { name: string; values: number[] }[]; isPlaceholder?: boolean }
  | { kind: "bar"; bars: { label: string; values: { name: string; value: number }[] }[]; isPlaceholder?: boolean }
  | { kind: "pie"; segments: { label: string; value: number }[]; isPlaceholder?: boolean };

export interface DashboardCharts {
  /** Line — current revenue vs the safe equilibrium line. */
  "revenue-vs-equilibrium": DashboardChartData;
  /** Pie — part-to-whole breakdown of revenue into costs, salary, incentives, and remaining profit. */
  "profit-composition": DashboardChartData;
  /** Grouped bar — previous vs current incentive payouts across recent months (trend). */
  "monthly-payout-comparison": DashboardChartData;
  /** Pie — department exposure share (or bonus vs salary increment split when departments aren't distinguishable). */
  "exposure-or-incentive-split": DashboardChartData;
}

export type DashboardChartKey = keyof DashboardCharts;

export interface DashboardChartInputs {
  currencyDisplay: CurrencyCode;
  exchangeRate?: number;
  /** Raw Dashboard variable-input values, already in currencyDisplay units (0 if unset). */
  revenue: number;
  totalCosts: number;
  salaryPayouts: number;
  profitToProtect: number;
  /** Live SimulationResults computed from the same inputs (KSH-based). */
  results: SimulationResults;
  /** Live assumptions added via the Dashboard's Incentive Qualifying Employees section. */
  assumptions: SelectedIncentiveAssumption[];
  /** True once the client has entered at least one core Dashboard variable. */
  hasRealData: boolean;
}

function buildPlaceholderCharts(): DashboardCharts {
  const P = PLACEHOLDER_VALUE;
  return {
    "revenue-vs-equilibrium": {
      kind: "line",
      isPlaceholder: true,
      labels: ["Start", "Now"],
      series: [
        { name: "Revenue", values: [P, P] },
        { name: "Equilibrium", values: [P, P] }
      ]
    },
    "profit-composition": {
      kind: "pie",
      isPlaceholder: true,
      segments: [
        { label: "Costs", value: P },
        { label: "Salary Payouts", value: P },
        { label: "Incentives", value: P },
        { label: "Remaining Profit", value: P }
      ]
    },
    "monthly-payout-comparison": {
      kind: "bar",
      isPlaceholder: true,
      bars: ["Month -5", "Month -4", "Month -3", "Month -2", "Month -1", "Current"].map((label) => ({
        label,
        values: [{ name: "Previous", value: P }, { name: "Current", value: P }]
      }))
    },
    "exposure-or-incentive-split": {
      kind: "pie",
      isPlaceholder: true,
      segments: [{ label: "Department A", value: P }, { label: "Department B", value: P }]
    }
  };
}

export function buildDashboardCharts(input: DashboardChartInputs): DashboardCharts {
  if (!input.hasRealData) return buildPlaceholderCharts();

  const exchangeRate = input.exchangeRate ?? null;
  const { results, currencyDisplay, revenue, totalCosts, salaryPayouts, assumptions } = input;

  const toDisplay = (valueKsh: number | null): number => {
    if (!isFiniteNumber(valueKsh)) return 0;
    return fromKsh(valueKsh, currencyDisplay, exchangeRate) ?? 0;
  };

  const equilibriumDisplay = toDisplay(results.equilibriumRevenueKsh);
  const totalExposureDisplay = toDisplay(results.totalIncentiveExposureKsh);
  const profitAfterDisplay = toDisplay(results.profitAfterIncentivesKsh);

  const { bonusExposureKsh, salaryIncrementExposureKsh } = computeBonusSalarySplitKsh(assumptions);

  const departmentExposureKsh = groupExposureByDepartment(assumptions);
  const departmentEntries = Object.entries(departmentExposureKsh).filter(([, value]) => value > 0);

  return {
    "revenue-vs-equilibrium": {
      kind: "line",
      labels: ["Start", "Now"],
      series: [
        { name: "Revenue", values: [revenue, revenue] },
        { name: "Equilibrium", values: [equilibriumDisplay, equilibriumDisplay] }
      ]
    },
    "profit-composition": {
      kind: "pie",
      // Real part-to-whole breakdown of revenue: where it goes (costs, salary, incentives)
      // and what's left (remaining profit, floored at 0 — never negative on a pie slice).
      segments: [
        { label: "Costs", value: totalCosts },
        { label: "Salary Payouts", value: salaryPayouts },
        { label: "Incentives", value: totalExposureDisplay },
        { label: "Remaining Profit", value: Math.max(0, profitAfterDisplay) }
      ]
    },
    "monthly-payout-comparison": {
      kind: "bar",
      // TODO: No monthly payout history model exists yet in the app. "Previous" is a zero
      // fallback for every period until historical payout tracking is added. Only the
      // "Current" bucket reflects a real, currently computed total incentive exposure.
      bars: ["Month -5", "Month -4", "Month -3", "Month -2", "Month -1", "Current"].map((label) => ({
        label,
        values: [
          { name: "Previous", value: 0 },
          { name: "Current", value: label === "Current" ? totalExposureDisplay : 0 }
        ]
      }))
    },
    "exposure-or-incentive-split": {
      kind: "pie",
      // Prefer a genuine department breakdown once 2+ departments have exposure; otherwise
      // fall back to the simpler bonus vs salary increment split — both are real, not fake.
      segments:
        departmentEntries.length >= 2
          ? departmentEntries.map(([label, valueKsh]) => ({ label, value: toDisplay(valueKsh) }))
          : [
              { label: "Bonus", value: toDisplay(bonusExposureKsh) },
              { label: "Salary Increment", value: toDisplay(salaryIncrementExposureKsh) }
            ]
    }
  };
}
