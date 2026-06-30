import { isFiniteNumber, toKsh } from "./currency";
import type {
  CurrencyCode,
  IncentiveRule,
  SelectedIncentiveAssumption,
  SimulationPeriod
} from "./types";

export interface ExposureResult {
  exposureKsh: number;
  warning?: string;
}

function cleanNumber(value: number | null | undefined): number | null {
  return isFiniteNumber(value) ? value : null;
}

function zeroIfMissing(value: number | null | undefined): number {
  return isFiniteNumber(value) ? value : 0;
}

export function calculateFixedExposure(
  amount: number | null | undefined,
  currency: CurrencyCode | undefined,
  qualifyingCount: number,
  exchangeRate?: number | null
): ExposureResult {
  if (!isFiniteNumber(qualifyingCount) || qualifyingCount < 0) {
    return { exposureKsh: 0, warning: "Counts cannot be negative." };
  }
  if (!isFiniteNumber(amount) || !currency) {
    return { exposureKsh: 0, warning: "Rule amount or currency is missing." };
  }
  const amountKsh = toKsh(amount, currency, exchangeRate);
  if (!isFiniteNumber(amountKsh)) {
    return { exposureKsh: 0, warning: "Needs Exchange Rate" };
  }
  return { exposureKsh: amountKsh * qualifyingCount };
}

export function calculatePercentageExposure(
  baseAmount: number | null | undefined,
  baseCurrency: CurrencyCode,
  percentageRate: number | null | undefined,
  qualifyingCount: number,
  exchangeRate?: number | null
): ExposureResult {
  if (!isFiniteNumber(qualifyingCount) || qualifyingCount < 0) {
    return { exposureKsh: 0, warning: "Counts cannot be negative." };
  }
  if (!isFiniteNumber(baseAmount)) {
    return { exposureKsh: 0, warning: "Base amount is required for percentage rules." };
  }
  if (!isFiniteNumber(percentageRate) || percentageRate < 0 || percentageRate > 100) {
    return { exposureKsh: 0, warning: "Percentage must be between 0 and 100." };
  }
  const baseKsh = toKsh(baseAmount, baseCurrency, exchangeRate);
  if (!isFiniteNumber(baseKsh)) {
    return { exposureKsh: 0, warning: "Needs Exchange Rate" };
  }
  return { exposureKsh: baseKsh * (percentageRate / 100) * qualifyingCount };
}

export function calculateMilestoneExposure(
  metricValue: number | null | undefined,
  threshold: number | null | undefined,
  amount: number | null | undefined,
  currency: CurrencyCode | undefined,
  qualifyingCount = 1,
  exchangeRate?: number | null
): ExposureResult {
  if (!isFiniteNumber(metricValue) || metricValue < 0) {
    return { exposureKsh: 0, warning: "Metric value is required and cannot be negative." };
  }
  if (!isFiniteNumber(qualifyingCount) || qualifyingCount < 0) {
    return { exposureKsh: 0, warning: "Counts cannot be negative." };
  }
  if (!isFiniteNumber(threshold) || threshold <= 0) {
    return { exposureKsh: 0, warning: "Rule milestone threshold is missing." };
  }
  if (!isFiniteNumber(amount) || !currency) {
    return { exposureKsh: 0, warning: "Rule milestone amount or currency is missing." };
  }
  const amountKsh = toKsh(amount, currency, exchangeRate);
  if (!isFiniteNumber(amountKsh)) {
    return { exposureKsh: 0, warning: "Needs Exchange Rate" };
  }
  const blocks = Math.floor(metricValue / threshold);
  return { exposureKsh: blocks * amountKsh * qualifyingCount };
}

export function calculateBillingPayout(
  collectionPercent: number | null | undefined,
  collectionFloorPercent: number | null | undefined,
  fullPayoutPercent: number | null | undefined,
  maxPayout: number | null | undefined
): ExposureResult {
  if (!isFiniteNumber(collectionPercent)) {
    return { exposureKsh: 0, warning: "Collection percentage is required." };
  }
  if (
    !isFiniteNumber(collectionFloorPercent) ||
    !isFiniteNumber(fullPayoutPercent) ||
    !isFiniteNumber(maxPayout)
  ) {
    return { exposureKsh: 0, warning: "Billing formula configuration is missing." };
  }
  if (fullPayoutPercent <= collectionFloorPercent) {
    return { exposureKsh: 0, warning: "Full payout percent must be greater than collection floor." };
  }
  if (collectionPercent < collectionFloorPercent) return { exposureKsh: 0 };
  if (collectionPercent >= fullPayoutPercent) return { exposureKsh: maxPayout };
  const ratio = (collectionPercent - collectionFloorPercent) / (fullPayoutPercent - collectionFloorPercent);
  return { exposureKsh: ratio * maxPayout };
}

export function calculatePeriodAdjustedExposure(
  rawExposureKsh: number,
  payoutFrequency: string | undefined,
  simulationPeriod: SimulationPeriod
): number {
  if (!isFiniteNumber(rawExposureKsh)) return 0;
  const frequency = (payoutFrequency ?? "").toLowerCase();
  const isMonthly = frequency.includes("monthly") || frequency.includes("month");
  const isQuarterly = frequency.includes("quarter");
  const isOneTime = frequency.includes("one-time") || frequency.includes("per client") || frequency.includes("per return");

  if (isMonthly) {
    if (simulationPeriod === "quarterly") return rawExposureKsh * 3;
    if (simulationPeriod === "annual") return rawExposureKsh * 12;
    return rawExposureKsh;
  }

  if (isQuarterly) {
    if (simulationPeriod === "monthly") return rawExposureKsh / 3;
    if (simulationPeriod === "annual") return rawExposureKsh * 4;
    return rawExposureKsh;
  }

  if (isOneTime) return rawExposureKsh;
  return rawExposureKsh;
}

export function calculateRuleAssumptionExposure(
  rule: IncentiveRule,
  input: {
    qualifyingCount: number;
    baseAmount?: number;
    baseAmountCurrency?: CurrencyCode;
    metricValue?: number;
    collectionPercentage?: number;
    exchangeRate?: number | null;
    simulationPeriod: SimulationPeriod;
  }
): ExposureResult {
  let result: ExposureResult;

  if (rule.payoutType === "percentage") {
    result = calculatePercentageExposure(
      input.baseAmount,
      input.baseAmountCurrency ?? "USD",
      rule.percentageRate,
      input.qualifyingCount,
      input.exchangeRate
    );
  } else if (rule.formulaType === "billing_collection") {
    result = calculateBillingPayout(
      input.collectionPercentage,
      Number(rule.formulaVariables?.collectionFloorPercent),
      Number(rule.formulaVariables?.fullPayoutPercent),
      Number(rule.formulaVariables?.maxPayout)
    );
  } else if (rule.formulaType === "marketing_view_blocks") {
    const threshold = Number(rule.formulaVariables?.viewThreshold);
    const faceReward = Number(rule.formulaVariables?.facePersonReward);
    const editorReward = Number(rule.formulaVariables?.editorReward);
    result = calculateMilestoneExposure(
      input.metricValue,
      threshold,
      faceReward + editorReward,
      "KSH",
      input.qualifyingCount,
      input.exchangeRate
    );
  } else if (rule.payoutType === "milestone" || rule.formulaType === "salary_milestone") {
    const threshold =
      cleanNumber(Number(rule.formulaVariables?.milestoneClientCount)) ??
      cleanNumber(Number(rule.formulaVariables?.subscriberMilestone)) ??
      cleanNumber(Number(rule.formulaVariables?.followerMilestone)) ??
      cleanNumber(rule.triggerThresholdValue);
    const amount =
      cleanNumber(rule.amount) ??
      cleanNumber(Number(rule.formulaVariables?.milestoneIncrementAmount)) ??
      cleanNumber(Number(rule.formulaVariables?.incrementAmount));
    result = calculateMilestoneExposure(
      input.metricValue,
      threshold,
      amount,
      rule.currency ?? "KSH",
      input.qualifyingCount,
      input.exchangeRate
    );
  } else if (rule.payoutType === "not-specified") {
    result = { exposureKsh: 0, warning: "Rule counts toward a threshold and has no direct payout configured." };
  } else {
    result = calculateFixedExposure(rule.amount, rule.currency, input.qualifyingCount, input.exchangeRate);
  }

  return {
    ...result,
    exposureKsh: calculatePeriodAdjustedExposure(result.exposureKsh, rule.payoutFrequency, input.simulationPeriod)
  };
}

export function calculateTotalIncentiveExposure(assumptions: SelectedIncentiveAssumption[]): number {
  return assumptions.reduce((total, assumption) => total + zeroIfMissing(assumption.estimatedExposureKsh), 0);
}

export function calculateProfitBeforeIncentives(
  revenueKsh: number | null,
  directCostsKsh: number | null,
  salaryPayoutsKsh: number | null
): number | null {
  if (!isFiniteNumber(revenueKsh) || !isFiniteNumber(directCostsKsh) || !isFiniteNumber(salaryPayoutsKsh)) {
    return null;
  }
  return revenueKsh - directCostsKsh - salaryPayoutsKsh;
}

export function calculateProfitAfterIncentives(
  profitBeforeIncentivesKsh: number | null,
  totalIncentiveExposureKsh: number | null
): number | null {
  if (!isFiniteNumber(profitBeforeIncentivesKsh) || !isFiniteNumber(totalIncentiveExposureKsh)) return null;
  return profitBeforeIncentivesKsh - totalIncentiveExposureKsh;
}

export function calculateMaximumSafePayout(
  profitBeforeIncentivesKsh: number | null,
  profitToProtectKsh: number | null
): number | null {
  if (!isFiniteNumber(profitBeforeIncentivesKsh) || !isFiniteNumber(profitToProtectKsh)) return null;
  return profitBeforeIncentivesKsh - profitToProtectKsh;
}

export function calculateEquilibriumRevenue(
  directCostsKsh: number | null,
  salaryPayoutsKsh: number | null,
  totalIncentiveExposureKsh: number | null,
  profitToProtectKsh: number | null
): number | null {
  if (
    !isFiniteNumber(directCostsKsh) ||
    !isFiniteNumber(salaryPayoutsKsh) ||
    !isFiniteNumber(totalIncentiveExposureKsh) ||
    !isFiniteNumber(profitToProtectKsh)
  ) {
    return null;
  }
  return directCostsKsh + salaryPayoutsKsh + totalIncentiveExposureKsh + profitToProtectKsh;
}

export function calculateAdditionalRevenueNeeded(equilibriumRevenueKsh: number | null, revenueKsh: number | null): number | null {
  if (!isFiniteNumber(equilibriumRevenueKsh) || !isFiniteNumber(revenueKsh)) return null;
  return Math.max(0, equilibriumRevenueKsh - revenueKsh);
}

export function calculateRevenueSurplus(revenueKsh: number | null, equilibriumRevenueKsh: number | null): number | null {
  if (!isFiniteNumber(revenueKsh) || !isFiniteNumber(equilibriumRevenueKsh)) return null;
  return revenueKsh - equilibriumRevenueKsh;
}

export function calculateCloseBufferKsh(
  closeBuffer: number | "",
  closeBufferMode: "amount" | "percent",
  profitToProtectKsh: number | null,
  inputCurrency: CurrencyCode,
  exchangeRate?: number | null
): number {
  if (!isFiniteNumber(closeBuffer)) return 0;
  if (closeBufferMode === "amount") {
    return toKsh(closeBuffer, inputCurrency, exchangeRate) ?? 0;
  }
  if (!isFiniteNumber(profitToProtectKsh)) return 0;
  return closeBuffer > 1 ? profitToProtectKsh * (closeBuffer / 100) : profitToProtectKsh * closeBuffer;
}

export function determineFinancialStatus(args: {
  exchangeRateNeeded: boolean;
  missingCoreValues: boolean;
  profitAfterIncentivesKsh: number | null;
  profitToProtectKsh: number | null;
  closeBufferKsh: number;
}): "Needs Exchange Rate" | "Needs More Numbers" | "Risky" | "Close" | "Safe" {
  if (args.exchangeRateNeeded) return "Needs Exchange Rate";
  if (args.missingCoreValues) return "Needs More Numbers";
  if (!isFiniteNumber(args.profitAfterIncentivesKsh) || !isFiniteNumber(args.profitToProtectKsh)) {
    return "Needs More Numbers";
  }
  const gap = args.profitAfterIncentivesKsh - args.profitToProtectKsh;
  if (gap < 0) return "Risky";
  if (gap <= args.closeBufferKsh) return "Close";
  return "Safe";
}

export function calculateBaseSalaryRatio(salaryPayoutsKsh: number | null, revenueKsh: number | null): number | null {
  if (!isFiniteNumber(salaryPayoutsKsh) || !isFiniteNumber(revenueKsh) || revenueKsh <= 0) return null;
  return salaryPayoutsKsh / revenueKsh;
}

export function calculateBonusRatio(bonusExposureKsh: number, revenueKsh: number | null): number | null {
  if (!isFiniteNumber(revenueKsh) || revenueKsh <= 0) return null;
  return bonusExposureKsh / revenueKsh;
}

export function calculateSalaryIncrementRatio(salaryIncrementExposureKsh: number, revenueKsh: number | null): number | null {
  if (!isFiniteNumber(revenueKsh) || revenueKsh <= 0) return null;
  return salaryIncrementExposureKsh / revenueKsh;
}

export function calculateSustainabilityRatio(
  salaryPayoutsKsh: number | null,
  bonusExposureKsh: number,
  salaryIncrementExposureKsh: number,
  revenueKsh: number | null
): number | null {
  if (!isFiniteNumber(salaryPayoutsKsh) || !isFiniteNumber(revenueKsh) || revenueKsh <= 0) return null;
  return (salaryPayoutsKsh + bonusExposureKsh + salaryIncrementExposureKsh) / revenueKsh;
}

export function calculateMaximumSafeMonthlyIncrement(
  maximumSafePayoutKsh: number | null,
  simulationPeriod: SimulationPeriod
): number | null {
  if (!isFiniteNumber(maximumSafePayoutKsh)) return null;
  if (simulationPeriod === "quarterly") return maximumSafePayoutKsh / 3;
  if (simulationPeriod === "annual") return maximumSafePayoutKsh / 12;
  return maximumSafePayoutKsh;
}

export function calculateBreakEvenDays(bonusAmountKsh: number | null, monthlyClientRevenueKsh: number | null): number | null {
  if (!isFiniteNumber(bonusAmountKsh) || !isFiniteNumber(monthlyClientRevenueKsh) || monthlyClientRevenueKsh <= 0) {
    return null;
  }
  return (bonusAmountKsh / monthlyClientRevenueKsh) * 30;
}

export function calculateRevenueProjection(startRevenueKsh: number, monthlyGrowthRate: number, months: number): number[] {
  if (!isFiniteNumber(startRevenueKsh) || !isFiniteNumber(monthlyGrowthRate) || !Number.isInteger(months) || months < 0) {
    return [];
  }
  return Array.from({ length: months }, (_, index) => startRevenueKsh * Math.pow(1 + monthlyGrowthRate, index));
}

export function calculateCompensationProjection(startCompensationKsh: number, monthlyGrowthRate: number, months: number): number[] {
  if (
    !isFiniteNumber(startCompensationKsh) ||
    !isFiniteNumber(monthlyGrowthRate) ||
    !Number.isInteger(months) ||
    months < 0
  ) {
    return [];
  }
  return Array.from({ length: months }, (_, index) => startCompensationKsh * Math.pow(1 + monthlyGrowthRate, index));
}

export function findCrossingPointMonth(revenueProjection: number[], compensationProjection: number[]): number | null {
  const months = Math.min(revenueProjection.length, compensationProjection.length);
  for (let index = 0; index < months; index += 1) {
    if (compensationProjection[index] >= revenueProjection[index]) return index + 1;
  }
  return null;
}
