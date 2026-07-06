import { formatCurrency, isFiniteNumber } from "./currency";
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

// The dashboard uses the same display conversion as the simulation page. If no exchange rate
// is supplied, USD display falls back to a safe "Needs Exchange Rate" state instead of
// silently applying a hard-coded conversion rate.
export const DASHBOARD_REFERENCE_EXCHANGE_RATE = Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE ?? 0);

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

function toKshOrNull(value: number): number | null {
  return value > 0 ? value : null;
}

/**
 * Computes live SimulationResults from the Dashboard's own variable inputs and sliders.
 * Reuses the existing simulation-formulas engine untouched — this is a display/data
 * adapter only, not a reimplementation of the math.
 */
export function computeDashboardResults(inputs: DashboardVariableInputs): SimulationResults {
  const revenueKsh = toKshOrNull(inputs.revenue);
  const directCostsKsh = toKshOrNull(inputs.totalCosts);
  const salaryPayoutsKsh = toKshOrNull(inputs.salaryPayouts);
  const profitToProtectKsh = toKshOrNull(inputs.profitToProtect);
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
    bonusExposureKsh: 0,
    salaryIncrementExposureKsh: 0,
    totalCompensationCostKsh: salaryPayoutsKsh !== null ? salaryPayoutsKsh + totalIncentiveExposureKsh : null,
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
  exchangeRate?: number | null
): string {
  const safeValueKsh = isFiniteNumber(valueKsh) ? valueKsh : 0;
  return formatCurrency(safeValueKsh, currencyDisplay, exchangeRate);
}

export function cleanDashboardStatusLabel(status: SimulationResults["financialStatus"]): string {
  if (status === "Needs Exchange Rate" || status === "Needs More Numbers") return "Awaiting Inputs";
  return status;
}
