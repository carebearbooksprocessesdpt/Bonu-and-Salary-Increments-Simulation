"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatRuleCurrency, isFiniteNumber, parseNumericInput, toKsh } from "@/lib/currency";
import { createScenarioSnapshot, scenarioStorageNote } from "@/lib/scenarios";
import {
  calculateAdditionalRevenueNeeded,
  calculateBaseSalaryRatio,
  calculateBonusRatio,
  calculateCloseBufferKsh,
  calculateEquilibriumRevenue,
  calculateMaximumSafeMonthlyIncrement,
  calculateMaximumSafePayout,
  calculateProfitAfterIncentives,
  calculateProfitBeforeIncentives,
  calculateRevenueSurplus,
  calculateRuleAssumptionExposure,
  calculateSalaryIncrementRatio,
  calculateSustainabilityRatio,
  calculateTotalIncentiveExposure,
  determineFinancialStatus
} from "@/lib/simulation-formulas";
import { getActiveRules, summarizePayout } from "@/lib/incentive-rules";
import type {
  CurrencyCode,
  IncentiveRule,
  SavedScenario,
  SelectedIncentiveAssumption,
  SimulationControls,
  SimulationResults
} from "@/lib/types";

const initialControls: SimulationControls = {
  revenue: "",
  directCosts: "",
  salaryPayouts: "",
  profitToProtect: "",
  currencyDisplay: "USD",
  exchangeRate: "",
  simulationPeriod: "monthly",
  closeBuffer: "",
  closeBufferMode: "amount"
};

function numericValue(value: number | ""): number | null {
  return isFiniteNumber(value) ? value : null;
}

function ratioLabel(value: number | null): string {
  if (!isFiniteNumber(value)) return "Needs numbers";
  return `${(value * 100).toFixed(1)}%`;
}

function numberLabel(value: number | null): string {
  if (!isFiniteNumber(value)) return "Needs numbers";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function ControlField({
  label,
  value,
  onChange,
  step = 1000,
  suffix
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  step?: number;
  suffix?: string;
}) {
  function adjust(delta: number) {
    const current = isFiniteNumber(value) ? value : 0;
    onChange(Math.max(0, current + delta));
  }

  return (
    <div className="compact-panel p-3">
      <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">{label}</label>
      <div className="mt-2 grid grid-cols-[34px_1fr_34px] items-center gap-2">
        <button className="btn btn-ghost h-9 px-0" type="button" onClick={() => adjust(-step)} aria-label={`Decrease ${label}`}>
          -
        </button>
        <input
          className="input h-10 px-2 text-center font-black text-dark-teal"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(parseNumericInput(event.target.value))}
        />
        <button className="btn btn-secondary h-9 px-0" type="button" onClick={() => adjust(step)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
      {suffix && <p className="mt-1 text-xs font-semibold text-slate-500">{suffix}</p>}
    </div>
  );
}

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="compact-panel p-3">
      <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">{label}</label>
      <select className="input mt-2 h-10 font-black text-dark-teal" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultCard({ label, value, tone }: { label: string; value: string; tone?: "risk" | "safe" | "close" }) {
  const toneClass =
    tone === "risk" ? "text-red-700" : tone === "safe" ? "text-dark-teal" : tone === "close" ? "text-amber-700" : "";
  return (
    <div className="result-card">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <strong className={toneClass}>{value}</strong>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number | null; max: number; color: string }) {
  const width = isFiniteNumber(value) && max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{isFiniteNumber(value) ? `${Math.round(width)}%` : "Waiting"}</span>
      </div>
      <div className="mt-1 h-3 rounded-full bg-sage-soft">
        <div className="h-3 rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function ChartsRow({
  results,
  display,
  exchangeRate,
  assumptions
}: {
  results: SimulationResults;
  display: "USD" | "KSH";
  exchangeRate: number | null;
  assumptions: SelectedIncentiveAssumption[];
}) {
  const maxRevenue = Math.max(
    results.revenueKsh ?? 0,
    results.equilibriumRevenueKsh ?? 0,
    results.profitBeforeIncentivesKsh ?? 0,
    1
  );
  const departmentExposure = assumptions.reduce<Record<string, number>>((totals, assumption) => {
    const department = assumption.ruleSnapshot.department;
    totals[department] = (totals[department] ?? 0) + assumption.estimatedExposureKsh;
    return totals;
  }, {});
  const bonusExposure = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType !== "Salary Increment")
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  const salaryExposure = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType === "Salary Increment" || assumption.ruleSnapshot.isPermanentSalaryIncrement)
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  const totalExposure = Math.max(bonusExposure + salaryExposure, 1);

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      <div className="chart-box">
        <h3 className="text-sm font-black text-ink">Revenue vs Equilibrium</h3>
        <div className="mt-5 space-y-4">
          <Bar label="Revenue" value={results.revenueKsh} max={maxRevenue} color="#0e3d3a" />
          <Bar label="Equilibrium" value={results.equilibriumRevenueKsh} max={maxRevenue} color="#c8893d" />
        </div>
      </div>
      <div className="chart-box">
        <h3 className="text-sm font-black text-ink">Department Exposure</h3>
        <div className="mt-4 space-y-2">
          {Object.keys(departmentExposure).length === 0 ? (
            <p className="text-sm font-semibold text-slate-500">Add assumptions to see department exposure.</p>
          ) : (
            Object.entries(departmentExposure).map(([department, value]) => (
              <div key={department} className="flex items-center justify-between rounded-lg bg-sage-soft px-3 py-2 text-sm">
                <span className="font-bold text-slate-700">{department}</span>
                <span className="font-black text-dark-teal">{formatCurrency(value, display, exchangeRate)}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="chart-box">
        <h3 className="text-sm font-black text-ink">Bonus vs Salary Increment</h3>
        <div className="mt-5 h-6 overflow-hidden rounded-full bg-sage-soft">
          <div className="flex h-full">
            <div className="bg-teal" style={{ width: `${(bonusExposure / totalExposure) * 100}%` }} />
            <div className="bg-sage" style={{ width: `${(salaryExposure / totalExposure) * 100}%` }} />
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm font-bold text-slate-700">
          <div className="flex justify-between"><span>Bonus</span><span>{formatCurrency(bonusExposure, display, exchangeRate)}</span></div>
          <div className="flex justify-between"><span>Salary Increment</span><span>{formatCurrency(salaryExposure, display, exchangeRate)}</span></div>
        </div>
      </div>
      <div className="chart-box">
        <h3 className="text-sm font-black text-ink">Profit Flow Waterfall</h3>
        <div className="mt-4 space-y-3">
          <Bar label="Revenue" value={results.revenueKsh} max={maxRevenue} color="#0e3d3a" />
          <Bar label="Before Incentives" value={results.profitBeforeIncentivesKsh} max={maxRevenue} color="#14595a" />
          <Bar label="After Incentives" value={results.profitAfterIncentivesKsh} max={maxRevenue} color="#c8893d" />
          <Bar label="Protected Profit" value={results.profitToProtectKsh} max={maxRevenue} color="#082a28" />
        </div>
      </div>
    </section>
  );
}

function QualifyingModal({
  rule,
  existing,
  exchangeRate,
  simulationPeriod,
  onClose,
  onSave
}: {
  rule: IncentiveRule;
  existing?: SelectedIncentiveAssumption;
  exchangeRate: number | null;
  simulationPeriod: SimulationControls["simulationPeriod"];
  onClose: () => void;
  onSave: (assumption: SelectedIncentiveAssumption) => void;
}) {
  const isPercentage = rule.payoutType === "percentage";
  const isBilling = rule.formulaType === "billing_collection";
  const isMilestone =
    rule.payoutType === "milestone" ||
    rule.formulaType === "marketing_view_blocks" ||
    rule.formulaType === "salary_milestone";

  const [qualifyingCount, setQualifyingCount] = useState<number | "">(existing?.qualifyingCount ?? 1);
  const [baseAmount, setBaseAmount] = useState<number | "">(existing?.baseAmount ?? "");
  const [baseAmountCurrency, setBaseAmountCurrency] = useState<CurrencyCode>(existing?.baseAmountCurrency ?? "USD");
  const [metricValue, setMetricValue] = useState<number | "">(existing?.metricValue ?? "");
  const [collectionPercentage, setCollectionPercentage] = useState<number | "">(existing?.collectionPercentage ?? "");
  const [note, setNote] = useState(existing?.note ?? "");

  const exposure = useMemo(
    () =>
      calculateRuleAssumptionExposure(rule, {
        qualifyingCount: numericValue(qualifyingCount) ?? 0,
        baseAmount: numericValue(baseAmount) ?? undefined,
        baseAmountCurrency,
        metricValue: numericValue(metricValue) ?? undefined,
        collectionPercentage: numericValue(collectionPercentage) ?? undefined,
        exchangeRate,
        simulationPeriod
      }),
    [rule, qualifyingCount, baseAmount, baseAmountCurrency, metricValue, collectionPercentage, exchangeRate, simulationPeriod]
  );

  function submit() {
    const next: SelectedIncentiveAssumption = {
      id: existing?.id ?? `assumption-${Date.now()}`,
      ruleId: rule.id,
      ruleSnapshot: rule,
      qualifyingCount: numericValue(qualifyingCount) ?? 0,
      baseAmount: numericValue(baseAmount) ?? undefined,
      baseAmountCurrency,
      metricValue: numericValue(metricValue) ?? undefined,
      collectionPercentage: numericValue(collectionPercentage) ?? undefined,
      note,
      estimatedExposureKsh: exposure.exposureKsh,
      warning: exposure.warning
    };
    onSave(next);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="drawer max-w-3xl">
        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">Qualifying Employees</p>
          <h2 className="mt-1 text-2xl font-black text-ink">{rule.ruleName}</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 rounded-2xl border border-line bg-sage-soft p-4 text-sm md:grid-cols-2">
            <div><span className="font-bold text-slate-600">Department:</span> {rule.department}</div>
            <div><span className="font-bold text-slate-600">Payout:</span> <strong>{summarizePayout(rule)}</strong></div>
            <div><span className="font-bold text-slate-600">Frequency:</span> {rule.payoutFrequency || rule.triggerFrequency || "Configured by rule"}</div>
            <div><span className="font-bold text-slate-600">Currency:</span> {rule.currency ?? rule.maxPayoutCurrency ?? "Configured by rule"}</div>
            <div><span className="font-bold text-slate-600">Formula type:</span> {rule.formulaType ?? "fixed"}</div>
            <div><span className="font-bold text-slate-600">Estimated exposure:</span> <strong>{formatRuleCurrency(exposure.exposureKsh, "KSH")}</strong></div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {!isBilling && (
              <ControlField label="Qualifying employees / count" value={qualifyingCount} onChange={setQualifyingCount} step={1} />
            )}
            {isPercentage && (
              <>
                <ControlField label="Base amount" value={baseAmount} onChange={setBaseAmount} step={100} />
                <SelectControl
                  label="Base amount currency"
                  value={baseAmountCurrency}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "KSH", label: "KSh" }
                  ]}
                  onChange={setBaseAmountCurrency}
                />
              </>
            )}
            {isMilestone && (
              <ControlField
                label={rule.ruleKey === "sales-ten-client-salary-milestone" ? "Counted clients" : "Metric value"}
                value={metricValue}
                onChange={setMetricValue}
                step={rule.ruleKey === "sales-ten-client-salary-milestone" ? 1 : 100}
              />
            )}
            {isBilling && (
              <ControlField label="Collection percentage" value={collectionPercentage} onChange={setCollectionPercentage} step={1} suffix="Enter 95 to mean 95%." />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">Note optional</label>
            <textarea className="input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>

          {exposure.warning && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{exposure.warning}</p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={submit}>Add to Simulation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimulationClient({ rules }: { rules: IncentiveRule[] }) {
  const activeRules = useMemo(() => getActiveRules(rules), [rules]);
  const [controls, setControls] = useState<SimulationControls>(initialControls);
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [modalRule, setModalRule] = useState<IncentiveRule | null>(null);
  const [editingAssumption, setEditingAssumption] = useState<SelectedIncentiveAssumption | null>(null);
  const [assumptions, setAssumptions] = useState<SelectedIncentiveAssumption[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [currencyMessage, setCurrencyMessage] = useState("Exchange rate can be edited manually.");

  const exchangeRate = numericValue(controls.exchangeRate);
  const inputCurrency: CurrencyCode = controls.currencyDisplay === "USD" ? "USD" : "KSH";

  const recalculatedAssumptions = useMemo(
    () =>
      assumptions.map((assumption) => {
        const exposure = calculateRuleAssumptionExposure(assumption.ruleSnapshot, {
          qualifyingCount: assumption.qualifyingCount,
          baseAmount: assumption.baseAmount,
          baseAmountCurrency: assumption.baseAmountCurrency,
          metricValue: assumption.metricValue,
          collectionPercentage: assumption.collectionPercentage,
          exchangeRate,
          simulationPeriod: controls.simulationPeriod
        });
        return { ...assumption, estimatedExposureKsh: exposure.exposureKsh, warning: exposure.warning };
      }),
    [assumptions, exchangeRate, controls.simulationPeriod]
  );

  const results = useMemo<SimulationResults>(() => {
    const revenueKsh = controls.revenue === "" ? null : toKsh(controls.revenue, inputCurrency, exchangeRate);
    const directCostsKsh = controls.directCosts === "" ? null : toKsh(controls.directCosts, inputCurrency, exchangeRate);
    const salaryPayoutsKsh = controls.salaryPayouts === "" ? null : toKsh(controls.salaryPayouts, inputCurrency, exchangeRate);
    const profitToProtectKsh = controls.profitToProtect === "" ? null : toKsh(controls.profitToProtect, inputCurrency, exchangeRate);
    const totalIncentiveExposureKsh = calculateTotalIncentiveExposure(recalculatedAssumptions);
    const profitBeforeIncentivesKsh = calculateProfitBeforeIncentives(revenueKsh, directCostsKsh, salaryPayoutsKsh);
    const profitAfterIncentivesKsh = calculateProfitAfterIncentives(profitBeforeIncentivesKsh, totalIncentiveExposureKsh);
    const maximumSafePayoutKsh = calculateMaximumSafePayout(profitBeforeIncentivesKsh, profitToProtectKsh);
    const equilibriumRevenueKsh = calculateEquilibriumRevenue(directCostsKsh, salaryPayoutsKsh, totalIncentiveExposureKsh, profitToProtectKsh);
    const additionalRevenueNeededKsh = calculateAdditionalRevenueNeeded(equilibriumRevenueKsh, revenueKsh);
    const revenueSurplusKsh = calculateRevenueSurplus(revenueKsh, equilibriumRevenueKsh);
    const bonusExposureKsh = recalculatedAssumptions
      .filter((assumption) => assumption.ruleSnapshot.incentiveType !== "Salary Increment")
      .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
    const salaryIncrementExposureKsh = recalculatedAssumptions
      .filter((assumption) => assumption.ruleSnapshot.incentiveType === "Salary Increment" || assumption.ruleSnapshot.isPermanentSalaryIncrement)
      .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
    const closeBufferKsh = calculateCloseBufferKsh(
      controls.closeBuffer,
      controls.closeBufferMode,
      profitToProtectKsh,
      inputCurrency,
      exchangeRate
    );
    const requiredCoreInputsValid = isFiniteNumber(revenueKsh) && isFiniteNumber(salaryPayoutsKsh);
    const exchangeRateNeeded =
      controls.currencyDisplay === "USD" &&
      (!exchangeRate || exchangeRate <= 0) &&
      requiredCoreInputsValid;
    const missingCoreValues = !requiredCoreInputsValid;

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
      maximumSafeMonthlyIncrementKsh: calculateMaximumSafeMonthlyIncrement(maximumSafePayoutKsh, controls.simulationPeriod),
      sustainabilityRatio: calculateSustainabilityRatio(salaryPayoutsKsh, bonusExposureKsh, salaryIncrementExposureKsh, revenueKsh),
      baseSalaryRatio: calculateBaseSalaryRatio(salaryPayoutsKsh, revenueKsh),
      bonusRatio: calculateBonusRatio(bonusExposureKsh, revenueKsh),
      salaryIncrementRatio: calculateSalaryIncrementRatio(salaryIncrementExposureKsh, revenueKsh),
      breakEvenDays: null,
      financialStatus: determineFinancialStatus({
        exchangeRateNeeded,
        missingCoreValues,
        profitAfterIncentivesKsh,
        profitToProtectKsh,
        closeBufferKsh
      })
    };
  }, [controls, inputCurrency, exchangeRate, recalculatedAssumptions]);

  function updateControl<K extends keyof SimulationControls>(key: K, value: SimulationControls[K]) {
    setControls((current) => ({ ...current, [key]: value }));
  }

  async function fetchLatestRate() {
    setCurrencyMessage("Checking currency provider...");
    try {
      const response = await fetch("/api/currency/usd-ksh", { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; rate: number | null; message: string };
      if (payload.ok && isFiniteNumber(payload.rate)) {
        updateControl("exchangeRate", payload.rate);
      }
      setCurrencyMessage(payload.message || "Exchange rate can be edited manually.");
    } catch {
      setCurrencyMessage("Currency API unavailable. Exchange rate can be edited manually.");
    }
  }

  function openSelectedRule() {
    const rule = activeRules.find((item) => item.id === selectedRuleId);
    if (rule) {
      setEditingAssumption(null);
      setModalRule(rule);
    }
  }

  function saveAssumption(assumption: SelectedIncentiveAssumption) {
    setAssumptions((current) => {
      const exists = current.some((item) => item.id === assumption.id);
      return exists ? current.map((item) => (item.id === assumption.id ? assumption : item)) : [assumption, ...current];
    });
    setModalRule(null);
    setEditingAssumption(null);
  }

  function saveScenario() {
    const scenario = createScenarioSnapshot({
      name: `Scenario ${savedScenarios.length + 1}`,
      controls,
      assumptions: recalculatedAssumptions,
      results
    });
    setSavedScenarios((current) => [scenario, ...current]);
    setSelectedScenarioId(scenario.id);
  }

  function loadScenario(scenarioId: string) {
    setSelectedScenarioId(scenarioId);
    const scenario = savedScenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    setControls(scenario.controls);
    setAssumptions(scenario.selectedIncentiveAssumptions);
  }

  function resetSimulation() {
    setControls(initialControls);
    setAssumptions([]);
    setSelectedRuleId("");
    setSelectedScenarioId("");
    setCurrencyMessage("Exchange rate can be edited manually.");
  }

  const displayMoney = (value: number | null) => formatCurrency(value, controls.currencyDisplay, exchangeRate);
  const statusTone = results.financialStatus === "Risky" ? "risk" : results.financialStatus === "Safe" ? "safe" : results.financialStatus === "Close" ? "close" : undefined;

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-black text-ink">Incentive Simulation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Estimate incentive exposure, protected profit, safe payout capacity, and revenue gaps from active Set
              Incentives rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="input h-10 min-w-56 font-bold" value={selectedScenarioId} onChange={(event) => loadScenario(event.target.value)}>
              <option value="">Saved scenarios</option>
              {savedScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
              ))}
            </select>
            <button className="btn btn-secondary" type="button" onClick={saveScenario}>Save Scenario</button>
            <button className="btn btn-ghost" type="button" onClick={resetSimulation}>Reset</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <ControlField label="Revenue" value={controls.revenue} onChange={(value) => updateControl("revenue", value)} />
        <ControlField label="Direct Costs" value={controls.directCosts} onChange={(value) => updateControl("directCosts", value)} />
        <ControlField label="Salary Payouts" value={controls.salaryPayouts} onChange={(value) => updateControl("salaryPayouts", value)} />
        <ControlField label="Profit to Protect" value={controls.profitToProtect} onChange={(value) => updateControl("profitToProtect", value)} />
        <SelectControl
          label="Currency Display"
          value={controls.currencyDisplay}
          options={[
            { value: "USD", label: "All USD" },
            { value: "KSH", label: "All KSh" }
          ]}
          onChange={(value) => updateControl("currencyDisplay", value)}
        />
        <div className="compact-panel p-3">
          <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">Exchange Rate</label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">1 USD =</span>
            <input
              className="input h-10 min-w-0 px-2 text-center font-black text-dark-teal"
              value={controls.exchangeRate}
              onChange={(event) => updateControl("exchangeRate", parseNumericInput(event.target.value))}
              inputMode="decimal"
            />
            <span className="text-xs font-bold text-slate-600">KSh</span>
          </div>
          <button className="mt-2 w-full rounded-full border border-line bg-white px-3 py-1.5 text-xs font-black text-dark-teal" type="button" onClick={fetchLatestRate}>
            Fetch latest
          </button>
          <p className="mt-1 text-xs font-semibold text-slate-500">{currencyMessage}</p>
        </div>
        <SelectControl
          label="Simulation Period"
          value={controls.simulationPeriod}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "annual", label: "Annual" }
          ]}
          onChange={(value) => updateControl("simulationPeriod", value)}
        />
        <div className="compact-panel p-3">
          <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-600">Close Buffer</label>
          <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
            <input className="input h-10 font-black text-dark-teal" value={controls.closeBuffer} onChange={(event) => updateControl("closeBuffer", parseNumericInput(event.target.value))} />
            <select className="input h-10 font-black text-dark-teal" value={controls.closeBufferMode} onChange={(event) => updateControl("closeBufferMode", event.target.value as "amount" | "percent")}>
              <option value="amount">Amount</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-black text-ink">Incentive Qualifying Employees</h3>
            <p className="mt-1 text-sm text-slate-600">
              Select active incentive rules and enter how many employees, claims, clients, views, or milestones qualify.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            {activeRules.length === 0 ? (
              <p className="rounded-xl border border-line bg-sage-soft px-3 py-2 text-sm font-bold text-slate-700">
                No active incentive rules found. Add rules in Set Incentives first.
              </p>
            ) : (
              <>
                <select className="input min-w-72 font-bold" value={selectedRuleId} onChange={(event) => setSelectedRuleId(event.target.value)}>
                  <option value="">Select Incentive</option>
                  {activeRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>{rule.ruleName}</option>
                  ))}
                </select>
                <button className="btn btn-primary" type="button" onClick={openSelectedRule} disabled={!selectedRuleId}>Select Incentive</button>
              </>
            )}
          </div>
        </div>

        <div className="table-wrap mt-5">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incentive</th>
                <th>Department</th>
                <th>Type</th>
                <th>Amount / Rate</th>
                <th>Frequency</th>
                <th>Qualifying Count / Metric</th>
                <th>Estimated Exposure</th>
                <th>Edit</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {recalculatedAssumptions.map((assumption) => (
                <tr key={assumption.id}>
                  <td>
                    <div className="font-black text-ink">{assumption.ruleSnapshot.ruleName}</div>
                    {assumption.warning && <div className="mt-1 text-xs font-bold text-amber-700">{assumption.warning}</div>}
                  </td>
                  <td><span className="badge">{assumption.ruleSnapshot.department}</span></td>
                  <td>{assumption.ruleSnapshot.incentiveType}</td>
                  <td><strong className="text-dark-teal">{summarizePayout(assumption.ruleSnapshot)}</strong></td>
                  <td>{assumption.ruleSnapshot.payoutFrequency || assumption.ruleSnapshot.triggerFrequency || "Configured by rule"}</td>
                  <td>
                    <span className="font-bold">{assumption.qualifyingCount}</span>
                    {isFiniteNumber(assumption.metricValue) && <span> | metric {assumption.metricValue}</span>}
                    {isFiniteNumber(assumption.collectionPercentage) && <span> | collection {assumption.collectionPercentage}%</span>}
                  </td>
                  <td><strong className="text-dark-teal">{displayMoney(assumption.estimatedExposureKsh)}</strong></td>
                  <td>
                    <button
                      className="btn btn-secondary px-3 py-2 text-xs"
                      type="button"
                      onClick={() => {
                        setEditingAssumption(assumption);
                        setModalRule(assumption.ruleSnapshot);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-ghost px-3 py-2 text-xs" type="button" onClick={() => setAssumptions((current) => current.filter((item) => item.id !== assumption.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recalculatedAssumptions.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-5 text-center text-sm font-bold text-slate-600">
            No incentive assumptions added yet.
          </div>
        )}
      </section>

      <ChartsRow results={results} display={controls.currencyDisplay} exchangeRate={exchangeRate} assumptions={recalculatedAssumptions} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResultCard label="Revenue" value={displayMoney(results.revenueKsh)} />
        <ResultCard label="Total Incentive Exposure" value={displayMoney(results.totalIncentiveExposureKsh)} />
        <ResultCard label="Profit Before Incentives" value={displayMoney(results.profitBeforeIncentivesKsh)} />
        <ResultCard label="Profit After Incentives" value={displayMoney(results.profitAfterIncentivesKsh)} />
        <ResultCard label="Profit to Protect" value={displayMoney(results.profitToProtectKsh)} />
        <ResultCard label="Equilibrium Revenue" value={displayMoney(results.equilibriumRevenueKsh)} />
        <ResultCard label="Additional Revenue Needed" value={displayMoney(results.additionalRevenueNeededKsh)} />
        <ResultCard label="Revenue Surplus" value={displayMoney(results.revenueSurplusKsh)} />
        <ResultCard label="Maximum Safe Payout" value={displayMoney(results.maximumSafePayoutKsh)} />
        <ResultCard label="Maximum Safe Monthly Increment" value={displayMoney(results.maximumSafeMonthlyIncrementKsh)} />
        <ResultCard label="Sustainability Ratio" value={ratioLabel(results.sustainabilityRatio)} />
        <ResultCard label="Base Salary Ratio" value={ratioLabel(results.baseSalaryRatio)} />
        <ResultCard label="Bonus Ratio" value={ratioLabel(results.bonusRatio)} />
        <ResultCard label="Salary Increment Ratio" value={ratioLabel(results.salaryIncrementRatio)} />
        <ResultCard label="Break-Even Days" value={numberLabel(results.breakEvenDays)} />
        <ResultCard label="Financial Status" value={results.financialStatus} tone={statusTone} />
      </section>

      <section className="compact-panel p-4">
        <p className="text-sm font-semibold leading-6 text-slate-600">{scenarioStorageNote}</p>
      </section>

      {modalRule && (
        <QualifyingModal
          rule={modalRule}
          existing={editingAssumption ?? undefined}
          exchangeRate={exchangeRate}
          simulationPeriod={controls.simulationPeriod}
          onClose={() => {
            setModalRule(null);
            setEditingAssumption(null);
          }}
          onSave={saveAssumption}
        />
      )}
    </div>
  );
}
