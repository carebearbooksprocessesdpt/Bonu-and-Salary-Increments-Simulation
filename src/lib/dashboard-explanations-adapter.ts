import { isFiniteNumber, fromKsh } from "./currency";
import { formatDashboardMoney } from "./dashboard-metrics-adapter";
import { computeBonusSalarySplitKsh, groupExposureByDepartment } from "./dashboard-groupings";
import type { CurrencyCode, SelectedIncentiveAssumption, SimulationResults } from "./types";

const PLACEHOLDER_VALUE = 50;

export type DashboardCardVisual =
  | { kind: "pie"; segments: { label: string; value: number }[]; isPlaceholder?: boolean }
  | { kind: "line"; labels: string[]; series: { name: string; values: number[] }[]; isPlaceholder?: boolean };

export interface DashboardNumberCard {
  key: string;
  title: string;
  value: string;
  /** Meaning, source, and improvement advice — 3 short statements. */
  points: [string, string, string];
  visual?: DashboardCardVisual;
}

export interface DashboardExplanationInputs {
  results: SimulationResults;
  currencyDisplay: CurrencyCode;
  assumptions: SelectedIncentiveAssumption[];
  hasRealData: boolean;
  exchangeRate?: number;
}

/**
 * Builds the standalone "Your Numbers" cards. Every value is read from the same live
 * SimulationResults/assumptions the rest of the Dashboard uses — no separate calculation
 * logic, no fake numbers. Visuals use the existing balanced-placeholder convention when
 * hasRealData is false.
 */
export function buildDashboardNumberCards(input: DashboardExplanationInputs): DashboardNumberCard[] {
  const { results, currencyDisplay, assumptions, hasRealData } = input;
  const exchangeRate = input.exchangeRate ?? null;
  const money = (valueKsh: number | null) => formatDashboardMoney(valueKsh, currencyDisplay, exchangeRate);
  const toDisplay = (valueKsh: number | null): number => {
    if (!isFiniteNumber(valueKsh)) return 0;
    return fromKsh(valueKsh, currencyDisplay, exchangeRate) ?? 0;
  };

  const { bonusExposureKsh, salaryIncrementExposureKsh } = computeBonusSalarySplitKsh(assumptions);
  const departmentExposureKsh = groupExposureByDepartment(assumptions);
  const departmentEntries = Object.entries(departmentExposureKsh).filter(([, value]) => value > 0);
  const totalExposureKsh = isFiniteNumber(results.totalIncentiveExposureKsh) ? results.totalIncentiveExposureKsh : 0;

  const P = PLACEHOLDER_VALUE;

  const incentiveSplitVisual: DashboardCardVisual = !hasRealData
    ? { kind: "pie", isPlaceholder: true, segments: [{ label: "Bonus", value: P }, { label: "Salary Increment", value: P }] }
    : {
        kind: "pie",
        segments: [
          { label: "Bonus", value: toDisplay(bonusExposureKsh) },
          { label: "Salary Increment", value: toDisplay(salaryIncrementExposureKsh) }
        ]
      };

  const departmentVisual: DashboardCardVisual = !hasRealData
    ? { kind: "pie", isPlaceholder: true, segments: [{ label: "Department A", value: P }, { label: "Department B", value: P }] }
    : {
        kind: "pie",
        segments:
          departmentEntries.length > 0
            ? departmentEntries.map(([label, valueKsh]) => ({ label, value: toDisplay(valueKsh) }))
            : [{ label: "No departments yet", value: 0 }]
      };

  const payoutTrendLabels = ["Month -5", "Month -4", "Month -3", "Month -2", "Month -1", "Current"];
  const payoutTrendVisual: DashboardCardVisual = !hasRealData
    ? {
        kind: "line",
        isPlaceholder: true,
        labels: payoutTrendLabels,
        series: [
          { name: "Previous", values: [P, P, P, P, P, P] },
          { name: "Current", values: [P, P, P, P, P, P] }
        ]
      }
    : {
        kind: "line",
        // TODO: No monthly payout history model exists yet — "Previous" is a zero fallback
        // for every period until historical payout tracking is added. Only the "Current"
        // period reflects a real, currently computed total incentive exposure.
        labels: payoutTrendLabels,
        series: [
          { name: "Previous", values: [0, 0, 0, 0, 0, 0] },
          { name: "Current", values: [0, 0, 0, 0, 0, toDisplay(totalExposureKsh)] }
        ]
      };

  return [
    {
      key: "profit-after-incentives",
      title: "Profit After Incentives",
      value: money(results.profitAfterIncentivesKsh),
      points: [
        "This shows how much profit remains after costs, salary payouts, and incentive exposure.",
        "It comes from revenue minus costs, salary payouts, and calculated incentive exposure.",
        "To improve it, increase revenue, reduce costs, or adjust incentive thresholds."
      ]
    },
    {
      key: "equilibrium-revenue",
      title: "Equilibrium Revenue",
      value: money(results.equilibriumRevenueKsh),
      points: [
        "This is the minimum revenue needed to protect the target profit.",
        "It comes from total costs, salary payouts, incentives, and profit to protect.",
        "To improve it, reduce fixed costs, reduce payout exposure, or increase sales."
      ]
    },
    {
      key: "additional-revenue-needed",
      title: "Additional Revenue Needed",
      value: money(results.additionalRevenueNeededKsh),
      points: [
        "This shows the gap between current revenue and the revenue needed to protect profit.",
        "It comes from comparing current revenue against equilibrium revenue.",
        "To improve it, increase sales, reduce costs, or reduce planned incentive exposure."
      ]
    },
    {
      key: "incentive-split",
      title: "Incentive Split",
      value: money(totalExposureKsh),
      points: [
        "This shows how incentives are divided between bonuses and salary increments.",
        "It comes from the current incentive rules and simulation data added below.",
        "To improve balance, review high-cost rules and adjust incentive types."
      ],
      visual: incentiveSplitVisual
    },
    {
      key: "exposure-by-department",
      title: "Exposure by Department",
      value: departmentEntries.length > 0 ? `${departmentEntries.length} department${departmentEntries.length === 1 ? "" : "s"}` : money(0),
      points: [
        "This shows which departments carry the most incentive exposure.",
        "It comes from active incentive rules and qualifying employee data.",
        "To improve it, review departments with high exposure and adjust thresholds."
      ],
      visual: departmentVisual
    },
    {
      key: "payout-trend",
      title: "Payout Trend",
      value: `Current period: ${money(totalExposureKsh)}`,
      points: [
        "This shows how payout exposure changes across months.",
        "It comes from previous and current payout data where available — no history yet, so past months show as zero.",
        "To improve it, compare months with high payout spikes and review the rules causing them."
      ],
      visual: payoutTrendVisual
    }
  ];
}
