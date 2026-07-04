"use client";

import { useMemo } from "react";
import { SimulationClient } from "@/components/SimulationClient";
import { DashboardCharts } from "@/components/DashboardCharts";
import { getActiveRules, incentiveRules } from "@/lib/incentive-rules";
import { isFiniteNumber } from "@/lib/currency";
import { calculateTotalIncentiveExposure } from "@/lib/simulation-formulas";
import { cleanDashboardStatusLabel, computeDashboardResults, formatDashboardMoney } from "@/lib/dashboard-metrics-adapter";
import { buildDashboardCharts } from "@/lib/dashboard-chart-adapter";
import { useDashboardState } from "@/lib/dashboard-state-context";
import type { CurrencyCode } from "@/lib/types";

// Dashboard-only UI state — clearly isolated from SimulationClient's own scenario state.
const SLIDER_MAX: Record<string, number> = {
  revenue: 10_000_000,
  totalCosts: 10_000_000,
  salaryPayouts: 5_000_000,
  profitToProtect: 5_000_000
};

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    );
  }

  if (name === "gauge") {
    return (
      <svg {...common}>
        <path d="M12 21a9 9 0 1 0-9-9" />
        <path d="M12 12l4-4" />
        <path d="M3 12h1" />
        <path d="M12 3v1" />
      </svg>
    );
  }

  return null;
}

function MetricCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: string;
  description: string;
  icon?: "activity" | "shield";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#064e4a] via-[#043330] to-[#021f1e] p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {icon && (
        <div className="absolute -bottom-6 -right-6 text-white/10">
          <Icon name={icon} className="h-28 w-28" />
        </div>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85">{title}</p>
      <p className="my-1 text-2xl font-medium">{value}</p>
      <span className="mt-1 block text-[10px] font-normal text-white/80">{description}</span>
    </div>
  );
}

type AffordabilityState = "no-data" | "risky" | "warning" | "safe";

// Whole-card gradient stays within the same color family (no black-ending) + whole-card
// pulse per status — not just a dot or text change.
const AFFORDABILITY_STYLES: Record<AffordabilityState, string> = {
  "no-data": "from-[#f97316] to-[#c2410c] card-pulse-orange",
  risky: "from-[#dc2626] to-[#991b1b] card-pulse-red",
  warning: "from-[#f59e0b] to-[#b45309] card-pulse-amber",
  safe: "from-[#16a34a] to-[#15803d] card-pulse-green"
};

function AffordabilityStatusCard({
  state,
  value,
  description
}: {
  state: AffordabilityState;
  value: string;
  description: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${AFFORDABILITY_STYLES[state]}`}
    >
      <div className="absolute -bottom-6 -right-6 text-white/10">
        <Icon name="gauge" className="h-28 w-28" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85">Affordability Status</p>
      <p className="my-1 text-2xl font-medium">{value}</p>
      <span className="mt-1 block text-[10px] font-normal text-white/85">{description}</span>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  max,
  symbol
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  max: number;
  symbol: string;
}) {
  const step = Math.max(1, Math.round(max / 1000));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-1">
        <label className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</label>
        <span className="text-[10px] font-normal text-slate-400">{symbol}</span>
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const parsed = parseFloat(event.target.value);
          onChange(Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : 0);
        }}
        className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-medium text-ink outline-none transition-shadow focus:border-[#064e4a] focus:ring-2 focus:ring-[#064e4a]/20"
      />
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        aria-label={`${label} slider`}
        className="mt-2 w-full accent-[#064e4a]"
      />
    </div>
  );
}

export function DashboardSimulationSection() {
  const {
    revenue,
    setRevenue,
    totalCosts,
    setTotalCosts,
    salaryPayouts,
    setSalaryPayouts,
    profitToProtect,
    setProfitToProtect,
    currencyDisplay,
    setCurrencyDisplay,
    expectedQualifying,
    setExpectedQualifying,
    assumptions,
    setAssumptions
  } = useDashboardState();

  const symbol = currencyDisplay === "USD" ? "USD" : "KSh";
  const activeRuleCount = useMemo(() => getActiveRules().length, []);

  // True once the client has entered at least one core Dashboard variable — gates whether
  // charts show real data or a neutral 50/50 placeholder visual.
  const hasRealData = revenue > 0 || totalCosts > 0 || salaryPayouts > 0 || profitToProtect > 0;

  // Real exposure summed from whatever the client has added in the Qualifying Employees
  // section below (0 if none added yet) — reuses the existing formula, not reimplemented.
  const totalIncentiveExposureKsh = useMemo(() => calculateTotalIncentiveExposure(assumptions), [assumptions]);

  const results = useMemo(
    () =>
      computeDashboardResults({
        revenue,
        totalCosts,
        salaryPayouts,
        profitToProtect,
        currencyDisplay,
        totalIncentiveExposureKsh
      }),
    [revenue, totalCosts, salaryPayouts, profitToProtect, currencyDisplay, totalIncentiveExposureKsh]
  );

  const charts = useMemo(
    () =>
      buildDashboardCharts({
        currencyDisplay,
        revenue,
        totalCosts,
        salaryPayouts,
        profitToProtect,
        results,
        assumptions,
        hasRealData
      }),
    [currencyDisplay, revenue, totalCosts, salaryPayouts, profitToProtect, results, assumptions, hasRealData]
  );

  const displayMoney = (valueKsh: number | null) => formatDashboardMoney(valueKsh, currencyDisplay);

  const additionalRevenueDescription = !isFiniteNumber(results.additionalRevenueNeededKsh)
    ? "Awaiting inputs"
    : results.additionalRevenueNeededKsh === 0
      ? "Revenue equilibrium met"
      : "Additional revenue required";

  const safetyBufferPercent =
    isFiniteNumber(results.profitAfterIncentivesKsh) && isFiniteNumber(results.profitToProtectKsh) && results.profitToProtectKsh > 0
      ? ((results.profitAfterIncentivesKsh - results.profitToProtectKsh) / results.profitToProtectKsh) * 100
      : null;

  const affordabilityState: AffordabilityState = !hasRealData
    ? "no-data"
    : results.financialStatus === "Risky"
      ? "risky"
      : results.financialStatus === "Close"
        ? "warning"
        : results.financialStatus === "Safe"
          ? "safe"
          : "no-data";

  const affordabilityValue = !hasRealData ? "Enter Your Data" : cleanDashboardStatusLabel(results.financialStatus);
  const affordabilityDescription = !hasRealData
    ? "Add revenue, costs, salary and protected profit to see your affordability status."
    : safetyBufferPercent === null
      ? "Awaiting inputs"
      : `${safetyBufferPercent.toFixed(1)}% safety buffer`;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-line bg-gradient-to-br from-white via-white to-teal-soft p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-ink">Simulation Variables</h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500">
            Type a value or drag the slider to adjust each variable.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MoneyField label="Revenue" value={revenue} onChange={setRevenue} max={SLIDER_MAX.revenue} symbol={symbol} />
          <MoneyField label="Total Costs" value={totalCosts} onChange={setTotalCosts} max={SLIDER_MAX.totalCosts} symbol={symbol} />
          <MoneyField label="Salary Payouts" value={salaryPayouts} onChange={setSalaryPayouts} max={SLIDER_MAX.salaryPayouts} symbol={symbol} />
          <MoneyField label="Profit to Protect" value={profitToProtect} onChange={setProfitToProtect} max={SLIDER_MAX.profitToProtect} symbol={symbol} />

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Currency Display
            </label>
            <select
              value={currencyDisplay}
              onChange={(event) => setCurrencyDisplay(event.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-normal text-ink outline-none focus:border-[#064e4a] focus:ring-2 focus:ring-[#064e4a]/20"
            >
              <option value="USD">USD</option>
              <option value="KSH">KSh (Local)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Expected Qualifying
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={expectedQualifying}
              onChange={(event) => {
                const parsed = parseInt(event.target.value, 10);
                setExpectedQualifying(Number.isFinite(parsed) ? parsed : "");
              }}
              placeholder="e.g. 25"
              className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-normal text-ink outline-none focus:border-[#064e4a] focus:ring-2 focus:ring-[#064e4a]/20"
            />
          </div>
        </div>
      </section>

      {/* Teal metric row — Affordability Status is first, same size as the rest. */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AffordabilityStatusCard state={affordabilityState} value={affordabilityValue} description={affordabilityDescription} />
        <MetricCard
          title="Total Exposure"
          value={displayMoney(results.totalIncentiveExposureKsh)}
          description={
            expectedQualifying !== ""
              ? `Expected ${expectedQualifying} qualifying • ${activeRuleCount} active rules`
              : `Based on ${activeRuleCount} active rules`
          }
          icon="activity"
        />
        <MetricCard title="Profit Before Incentives" value={displayMoney(results.profitBeforeIncentivesKsh)} description="Revenue minus costs and salary payouts" />
        <MetricCard
          title="Profit After Incentives"
          value={displayMoney(results.profitAfterIncentivesKsh)}
          description={`Protected limit: ${displayMoney(results.profitToProtectKsh)}`}
          icon="shield"
        />
        <MetricCard title="Equilibrium Revenue" value={displayMoney(results.equilibriumRevenueKsh)} description="Required to cover expenses" />
        <MetricCard title="Additional Revenue Needed" value={displayMoney(results.additionalRevenueNeededKsh)} description={additionalRevenueDescription} />
      </section>

      {/* Only the Incentive Qualifying Employees section, reused from SimulationClient.
          onAssumptionsChange lifts the live assumptions up so the metric cards/charts above
          can reflect real incentive exposure — no formulas are duplicated or changed. */}
      <SimulationClient rules={incentiveRules} hideHero onlyQualifyingEmployees onAssumptionsChange={setAssumptions} />

      <DashboardCharts charts={charts} currencyDisplay={currencyDisplay} hasRealData={hasRealData} />
    </div>
  );
}
