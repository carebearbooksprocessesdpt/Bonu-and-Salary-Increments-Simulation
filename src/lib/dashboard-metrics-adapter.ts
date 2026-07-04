import { formatCurrency, isFiniteNumber, toKsh } from "./currency";
import {
  calculateAdditionalRevenueNeeded,
  calculateEquilibriumRevenue,
  calculateMaximumSafeMonthlyIncrement,
  calculateMaximumSafePayout,
  calculateProfitAfterIncentives,
  calculateProfitBeforeIncentives,
  calculateRevenueSurplus,
  determineFinancialStatus
} from "./simulation-formulas";
import type { CurrencyCode, SimulationResults } from "./types";

// TODO: The Dashboard does not yet expose its own exchange-rate input (that control lives
// on the Incentive Simulation page). Until a live rate is wired in here, USD<->KSH display
// conversion uses this fixed reference rate. This does not affect any calculation/formula —
// it only affects how already-computed KSH amounts are displayed in USD, and vice versa.
export const DASHBOARD_REFERENCE_EXCHANGE_RATE = 130;

export interface DashboardVariableInputs {
  revenue: number;
  totalCosts: number;
  salaryPayouts: number;
  profitToProtect: number;
  currencyDisplay: CurrencyCode;
  /** Real exposure summed from the Dashboard's Incentive Qualifying Employees assumptions. 0 if none added. */
  totalIncentiveExposureKsh: number;
  exchangeRate?: number;
}

function toKshOrNull(value: number, currency: CurrencyCode, exchangeRate: number): number | null {
  return value > 0 ? toKsh(value, currency, exchangeRate) : null;
}

/**
 * Computes live SimulationResults from the Dashboard's own variable inputs and sliders.
 * Reuses the existing simulation-formulas engine untouched — this is a display/data
 * adapter only, not a reimplementation of the math.
 */
export function computeDashboardResults(inputs: DashboardVariableInputs): SimulationResults {
  const exchangeRate = inputs.exchangeRate ?? DASHBOARD_REFERENCE_EXCHANGE_RATE;
  const revenueKsh = toKshOrNull(inputs.revenue, inputs.currencyDisplay, exchangeRate);
  const directCostsKsh = toKshOrNull(inputs.totalCosts, inputs.currencyDisplay, exchangeRate);
  const salaryPayoutsKsh = toKshOrNull(inputs.salaryPayouts, inputs.currencyDisplay, exchangeRate);
  const profitToProtectKsh = toKshOrNull(inputs.profitToProtect, inputs.currencyDisplay, exchangeRate);
  const totalIncentiveExposureKsh = isFiniteNumber(inputs.totalIncentiveExposureKsh) ? inputs.totalIncentiveExposureKsh : 0;

  const profitBeforeIncentivesKsh = calculateProfitBeforeIncentives(revenueKsh, directCostsKsh, salaryPayoutsKsh);
  const profitAfterIncentivesKsh = calculateProfitAfterIncentives(profitBeforeIncentivesKsh, totalIncentiveExposureKsh);
  const maximumSafePayoutKsh = calculateMaximumSafePayout(profitBeforeIncentivesKsh, profitToProtectKsh);
  const equilibriumRevenueKsh = calculateEquilibriumRevenue(directCostsKsh, salaryPayoutsKsh, totalIncentiveExposureKsh, profitToProtectKsh);
  const additionalRevenueNeededKsh = calculateAdditionalRevenueNeeded(equilibriumRevenueKsh, revenueKsh);
  const revenueSurplusKsh = calculateRevenueSurplus(revenueKsh, equilibriumRevenueKsh);
  const missingCoreValues = [revenueKsh, directCostsKsh, salaryPayoutsKsh, profitToProtectKsh].some((value) => value === null);

  return {
    revenueKsh,
    totalIncentiveExposureKsh,
    profitBeforeIncentivesKsh,
    profitAfterIncentivesKsh,
    profitToProtectKsh,
    equilibriumRevenueKsh,
    additionalRevenueNeededKsh,
    revenueSurplusKsh,
    maximumSafePayoutKsh,
    maximumSafeMonthlyIncrementKsh: calculateMaximumSafeMonthlyIncrement(maximumSafePayoutKsh, "monthly"),
    sustainabilityRatio: null,
    baseSalaryRatio: null,
    bonusRatio: null,
    salaryIncrementRatio: null,
    breakEvenDays: null,
    financialStatus: determineFinancialStatus({
      exchangeRateNeeded: false,
      missingCoreValues,
      profitAfterIncentivesKsh,
      profitToProtectKsh,
      closeBufferKsh: 0
    })
  };
}

/** Formats a KSH-based amount for display, defaulting to a zero label instead of "Needs numbers". */
export function formatDashboardMoney(
  valueKsh: number | null,
  currencyDisplay: CurrencyCode,
  exchangeRate: number = DASHBOARD_REFERENCE_EXCHANGE_RATE
): string {
  const safeValueKsh = isFiniteNumber(valueKsh) ? valueKsh : 0;
  return formatCurrency(safeValueKsh, currencyDisplay, exchangeRate);
}

export function cleanDashboardStatusLabel(status: SimulationResults["financialStatus"]): string {
  if (status === "Needs Exchange Rate" || status === "Needs More Numbers") return "Awaiting Inputs";
  return status;
}
