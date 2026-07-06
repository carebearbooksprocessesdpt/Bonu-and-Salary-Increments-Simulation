"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatRuleCurrency, isFiniteNumber, parseNumericInput, toKsh } from "@/lib/currency";
import { createScenarioSnapshot, scenarioStorageNote } from "@/lib/scenarios";
import {
  calculateAdditionalRevenueNeeded,
  calculateBaseSalaryRatio,
  calculateBonusExposure,
  calculateBonusRatio,
  calculateCloseBufferKsh,
  calculateEquilibriumRevenue,
  calculateMaximumSafeMonthlyIncrement,
  calculateMaximumSafePayout,
  calculateProfitAfterIncentives,
  calculateProfitBeforeIncentives,
  calculateRevenueSurplus,
  calculateRuleAssumptionExposure,
  calculateSalaryIncrementExposure,
  calculateSalaryIncrementRatio,
  calculateSustainabilityRatio,
  calculateTotalCompensationCost,
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
  if (!isFiniteNumber(value)) return "Awaiting inputs";
  return `${(value * 100).toFixed(1)}%`;
}

function numberLabel(value: number | null): string {
  if (!isFiniteNumber(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

const CHART_COLORS = {
  revenue: "#0e3d3a",
  equilibrium: "#c8893d",
  bonus: "#14595a",
  salaryIncrement: "#7c5cbf",
  profit: "#244c3a",
  profitAfter: "#c8893d",
  protectedProfit: "#082a28",
  safe: "#22835a",
  warn: "#d4940a",
  risk: "#c44e42",
  departments: [
    "#0e3d3a", "#14595a", "#c8893d", "#7c5cbf",
    "#2c5d7a", "#244c3a", "#8a3d35", "#5d6657",
    "#1d7c7c", "#a8702a", "#6b46a3"
  ]
};

type ChartType =
  | "revenue-vs-equilibrium"
  | "previous-vs-current"
  | "department-bonus"
  | "department-incentive"
  | "bonus-vs-salary"
  | "profit-flow"
  | "department-exposure"
  | "salary-vs-departments";

const chartOptions: { value: ChartType; label: string }[] = [
  { value: "revenue-vs-equilibrium", label: "Revenue vs Equilibrium" },
  { value: "previous-vs-current", label: "Previous vs Current Payouts" },
  { value: "department-bonus", label: "Department Bonus Payouts" },
  { value: "department-incentive", label: "Incentive Distribution by Department" },
  { value: "bonus-vs-salary", label: "Bonus vs Salary Increment" },
  { value: "profit-flow", label: "Profit Flow" },
  { value: "department-exposure", label: "Incentive Exposure by Department" },
  { value: "salary-vs-departments", label: "Salary Payouts vs Departments" }
];

function EmptyState({ message, type = "bar" }: { message: string; type?: "bar" | "pie" | "info" }) {
  return (
    <div className="empty-state">
      {type === "pie" ? (
        <div className="empty-state-preview">
          <div className="flex justify-center mb-3">
            <svg width="100" height="100" viewBox="0 0 100 100" role="img" aria-label="Preview">
              <path d="M 50 6 A 44 44 0 0 1 92 60 L 50 50 Z" fill="rgba(14,61,58,0.1)" stroke="white" strokeWidth="2" />
              <path d="M 92 60 A 44 44 0 0 1 22 88 L 50 50 Z" fill="rgba(200,137,61,0.1)" stroke="white" strokeWidth="2" />
              <path d="M 22 88 A 44 44 0 0 1 8 38 L 50 50 Z" fill="rgba(124,92,191,0.1)" stroke="white" strokeWidth="2" />
              <path d="M 8 38 A 44 44 0 0 1 50 6 L 50 50 Z" fill="rgba(44,93,122,0.1)" stroke="white" strokeWidth="2" />
              <circle cx="50" cy="50" r="18" fill="white" />
            </svg>
          </div>
        </div>
      ) : type === "bar" ? (
        <div className="empty-state-preview">
          <div className="space-y-2.5 mb-3">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
              <div className="preview-bar h-full rounded-full" style={{ width: "78%", background: "linear-gradient(90deg, rgba(14,61,58,0.15), rgba(14,61,58,0.06))" }} />
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
              <div className="preview-bar h-full rounded-full" style={{ width: "55%", background: "linear-gradient(90deg, rgba(200,137,61,0.15), rgba(200,137,61,0.06))", animationDelay: "0.3s" }} />
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
              <div className="preview-bar h-full rounded-full" style={{ width: "40%", background: "linear-gradient(90deg, rgba(124,92,191,0.15), rgba(124,92,191,0.06))", animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-8 4 4 4-6" />
          </svg>
        </div>
      )}
      <p className="text-sm font-normal">{message}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Safe") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22835a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (status === "Risky") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c44e42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (status === "Close") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4940a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5d6657" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ResultIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();
  if (lower.includes("revenue") && !lower.includes("additional") && !lower.includes("surplus")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    );
  }
  if (lower.includes("exposure") || lower.includes("incentive")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    );
  }
  if (lower.includes("profit")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }
  if (lower.includes("equilibrium")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" /><path d="M8 7l4-4 4 4" /><path d="M8 17l4 4 4-4" />
      </svg>
    );
  }
  if (lower.includes("status")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (lower.includes("ratio") || lower.includes("break")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" />
    </svg>
  );
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
      <label className="text-xs font-medium uppercase tracking-[0.1em] text-slate-600">{label}</label>
      <div className="mt-2 grid grid-cols-[34px_1fr_34px] items-center gap-2">
        <button className="btn btn-ghost h-9 px-0" type="button" onClick={() => adjust(-step)} aria-label={`Decrease ${label}`}>
          -
        </button>
        <input
          className="input h-10 px-2 text-center font-medium text-dark-teal"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(parseNumericInput(event.target.value))}
        />
        <button className="btn btn-secondary h-9 px-0" type="button" onClick={() => adjust(step)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
      {suffix && <p className="mt-1 text-xs font-normal text-slate-500">{suffix}</p>}
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
      <label className="text-xs font-medium uppercase tracking-[0.1em] text-slate-600">{label}</label>
      <select className="input mt-2 h-10 font-medium text-dark-teal" value={value} onChange={(event) => onChange(event.target.value as T)}>
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
    tone === "risk" ? "text-red-300" : tone === "safe" ? "text-emerald-300" : tone === "close" ? "text-amber-300" : "";
  return (
    <div className="result-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <ResultIcon label={label} />
      </div>
      <strong className={`font-medium ${toneClass}`}>{value}</strong>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number | null; max: number; color: string }) {
  const width = isFiniteNumber(value) && max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-normal text-slate-600">
        <span>{label}</span>
        <span>{isFiniteNumber(value) ? `${Math.round(width)}%` : "Waiting"}</span>
      </div>
      <div className="mt-1 h-3.5 rounded-full bg-sage-soft overflow-hidden">
        <div className="h-full rounded-full bar-animated" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function PieChart({
  segments,
  size = 160
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return <EmptyState message="No data to display." />;

  const center = size / 2;
  const radius = (size / 2) - 8;
  let cumulativeAngle = -90;

  const arcs = segments.filter(s => s.value > 0).map((segment) => {
    const angle = (segment.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const path = segments.filter(s => s.value > 0).length === 1
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...segment, path, percentage: ((segment.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {arcs.map((arc, index) => (
          <path key={index} d={arc.path} fill={arc.color} className="pie-segment" stroke="white" strokeWidth="2">
            <title>{`${arc.label}: ${arc.percentage}%`}</title>
          </path>
        ))}
        <circle cx={center} cy={center} r={radius * 0.45} fill="white" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {arcs.map((arc, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs font-normal text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: arc.color }} />
            <span>{arc.label}</span>
            <span className="text-slate-400">{arc.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarGraph({
  bars,
  maxValue
}: {
  bars: { label: string; value: number; color: string }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...bars.map(b => b.value), 1);
  if (bars.every(b => b.value === 0)) return <EmptyState message="Enter values to see this chart." />;

  return (
    <div className="space-y-3">
      {bars.map((bar, index) => (
        <div key={index}>
          <div className="flex items-center justify-between text-xs font-normal text-slate-600 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: bar.color }} />
              {bar.label}
            </span>
            <span className="font-medium text-dark-teal">
              {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(bar.value)}
            </span>
          </div>
          <div className="h-4 rounded-full bg-sage-soft overflow-hidden">
            <div
              className="h-full rounded-full bar-animated"
              style={{
                width: `${max > 0 ? Math.min(100, (bar.value / max) * 100) : 0}%`,
                background: bar.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  selectedChart,
  onChartChange,
  results,
  display,
  exchangeRate,
  assumptions,
  chartSlot
}: {
  selectedChart: ChartType;
  onChartChange: (chart: ChartType) => void;
  results: SimulationResults;
  display: "USD" | "KSH";
  exchangeRate: number | null;
  assumptions: SelectedIncentiveAssumption[];
  chartSlot: 1 | 2;
}) {
  const departmentExposure = useMemo(() => {
    return assumptions.reduce<Record<string, number>>((totals, assumption) => {
      const department = assumption.ruleSnapshot.department;
      totals[department] = (totals[department] ?? 0) + assumption.estimatedExposureKsh;
      return totals;
    }, {});
  }, [assumptions]);

  const departmentBonuses = useMemo(() => {
    return assumptions
      .filter(a => a.ruleSnapshot.incentiveType !== "Salary Increment" && !a.ruleSnapshot.isPermanentSalaryIncrement)
      .reduce<Record<string, number>>((totals, a) => {
        totals[a.ruleSnapshot.department] = (totals[a.ruleSnapshot.department] ?? 0) + a.estimatedExposureKsh;
        return totals;
      }, {});
  }, [assumptions]);

  const bonusExposure = assumptions
    .filter(a => a.ruleSnapshot.incentiveType !== "Salary Increment")
    .reduce((total, a) => total + a.estimatedExposureKsh, 0);
  const salaryExposure = assumptions
    .filter(a => a.ruleSnapshot.incentiveType === "Salary Increment" || a.ruleSnapshot.isPermanentSalaryIncrement)
    .reduce((total, a) => total + a.estimatedExposureKsh, 0);

  const maxRevenue = Math.max(
    results.revenueKsh ?? 0,
    results.equilibriumRevenueKsh ?? 0,
    results.profitBeforeIncentivesKsh ?? 0,
    1
  );

  function renderChart(): React.ReactNode {
    switch (selectedChart) {
      case "revenue-vs-equilibrium": {
        if (!isFiniteNumber(results.revenueKsh) && !isFiniteNumber(results.equilibriumRevenueKsh)) {
          return <EmptyState message="Enter revenue and cost inputs to preview this chart." type="bar" />;
        }
        const revenueAbove = isFiniteNumber(results.revenueKsh) && isFiniteNumber(results.equilibriumRevenueKsh) && results.revenueKsh >= results.equilibriumRevenueKsh;
        return (
          <div className="space-y-4">
            <BarGraph
              bars={[
                { label: "Current Revenue", value: results.revenueKsh ?? 0, color: CHART_COLORS.revenue },
                { label: "Equilibrium Revenue", value: results.equilibriumRevenueKsh ?? 0, color: CHART_COLORS.equilibrium }
              ]}
            />
            {isFiniteNumber(results.revenueKsh) && isFiniteNumber(results.equilibriumRevenueKsh) && (
              <div className={`rounded-xl px-3 py-2 text-xs font-medium ${revenueAbove ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {revenueAbove
                  ? `Revenue is above equilibrium by ${formatCurrency(results.revenueSurplusKsh, display, exchangeRate)}`
                  : `Revenue is below equilibrium. Additional ${formatCurrency(results.additionalRevenueNeededKsh, display, exchangeRate)} needed.`}
              </div>
            )}
          </div>
        );
      }

      case "previous-vs-current":
        return (
          <div className="empty-state">
            <div className="empty-state-preview">
              <div className="space-y-3 mb-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-normal text-slate-300 mb-1">
                    <span>Previous Payouts</span><span>—</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
                    <div className="preview-bar h-full rounded-full" style={{ width: "65%", background: "linear-gradient(90deg, rgba(14,61,58,0.12), rgba(14,61,58,0.04))" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-normal text-slate-300 mb-1">
                    <span>Current Payouts</span><span>—</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
                    <div className="preview-bar h-full rounded-full" style={{ width: "45%", background: "linear-gradient(90deg, rgba(200,137,61,0.12), rgba(200,137,61,0.04))", animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-normal">Previous payout data is not available yet.</p>
            <p className="text-xs text-slate-400">Save a scenario first, then run a new simulation to compare.</p>
          </div>
        );

      case "department-bonus": {
        const entries = Object.entries(departmentBonuses).filter(([, v]) => v > 0);
        if (entries.length === 0) return <EmptyState message="Add qualifying employees to calculate department bonuses." type="pie" />;
        return (
          <PieChart
            segments={entries.map(([dept, value], i) => ({
              label: dept,
              value,
              color: CHART_COLORS.departments[i % CHART_COLORS.departments.length]
            }))}
          />
        );
      }

      case "department-incentive": {
        const entries = Object.entries(departmentExposure).filter(([, v]) => v > 0);
        if (entries.length === 0) return <EmptyState message="Add qualifying employees to see incentive distribution." type="pie" />;
        return (
          <PieChart
            segments={entries.map(([dept, value], i) => ({
              label: dept,
              value,
              color: CHART_COLORS.departments[i % CHART_COLORS.departments.length]
            }))}
          />
        );
      }

      case "bonus-vs-salary": {
        const total = bonusExposure + salaryExposure;
        if (total === 0) return <EmptyState message="Add assumptions to see bonus vs salary increment split." type="pie" />;
        return (
          <div className="space-y-4">
            <PieChart
              segments={[
                { label: "Bonus", value: bonusExposure, color: CHART_COLORS.bonus },
                { label: "Salary Increment", value: salaryExposure, color: CHART_COLORS.salaryIncrement }
              ]}
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-sage-soft px-3 py-2 text-center">
                <div className="text-xs font-normal text-slate-500">Bonus</div>
                <div className="font-medium text-dark-teal">{formatCurrency(bonusExposure, display, exchangeRate)}</div>
              </div>
              <div className="rounded-xl bg-purple-50 px-3 py-2 text-center">
                <div className="text-xs font-normal text-slate-500">Salary Increment</div>
                <div className="font-medium text-purple-800">{formatCurrency(salaryExposure, display, exchangeRate)}</div>
              </div>
            </div>
          </div>
        );
      }

      case "profit-flow":
        if (!isFiniteNumber(results.revenueKsh)) return <EmptyState message="Enter revenue and costs to see profit flow." type="bar" />;
        return (
          <BarGraph
            bars={[
              { label: "Revenue", value: results.revenueKsh ?? 0, color: CHART_COLORS.revenue },
              { label: "Profit Before Incentives", value: results.profitBeforeIncentivesKsh ?? 0, color: CHART_COLORS.profit },
              { label: "Profit After Incentives", value: results.profitAfterIncentivesKsh ?? 0, color: CHART_COLORS.profitAfter },
              { label: "Protected Profit", value: results.profitToProtectKsh ?? 0, color: CHART_COLORS.protectedProfit }
            ]}
            maxValue={maxRevenue}
          />
        );

      case "department-exposure": {
        const entries = Object.entries(departmentExposure).filter(([, v]) => v > 0);
        if (entries.length === 0) return <EmptyState message="Add assumptions to see department exposure." type="bar" />;
        return (
          <div className="space-y-2">
            {entries.map(([department, value], index) => (
              <div key={department} className="flex items-center justify-between rounded-xl border border-line bg-sage-soft px-3 py-2.5 text-sm transition-all hover:border-teal-soft hover:shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: CHART_COLORS.departments[index % CHART_COLORS.departments.length] }} />
                  <span className="font-medium text-slate-700">{department}</span>
                </div>
                <span className="font-medium text-dark-teal">{formatCurrency(value, display, exchangeRate)}</span>
              </div>
            ))}
          </div>
        );
      }

      case "salary-vs-departments": {
        const salaryByDept = assumptions
          .filter(a => a.ruleSnapshot.incentiveType === "Salary Increment" || a.ruleSnapshot.isPermanentSalaryIncrement)
          .reduce<Record<string, number>>((totals, a) => {
            totals[a.ruleSnapshot.department] = (totals[a.ruleSnapshot.department] ?? 0) + a.estimatedExposureKsh;
            return totals;
          }, {});
        const entries = Object.entries(salaryByDept).filter(([, v]) => v > 0);
        if (entries.length === 0) return <EmptyState message="No salary increment exposure by department yet." type="bar" />;
        return (
          <BarGraph
            bars={entries.map(([dept, value], i) => ({
              label: dept,
              value,
              color: CHART_COLORS.departments[i % CHART_COLORS.departments.length]
            }))}
          />
        );
      }

      default:
        return <EmptyState message="Select a chart type." />;
    }
  }

  const chartLabel = chartOptions.find(o => o.value === selectedChart)?.label ?? "Chart";
  const isPie = selectedChart === "department-bonus" || selectedChart === "department-incentive" || selectedChart === "bonus-vs-salary";
  const headerColors: Record<string, string> = {
    "revenue-vs-equilibrium": "linear-gradient(135deg, rgba(14,61,58,0.07), rgba(20,89,90,0.03))",
    "previous-vs-current": "linear-gradient(135deg, rgba(14,61,58,0.05), rgba(200,137,61,0.04))",
    "department-bonus": "linear-gradient(135deg, rgba(124,92,191,0.06), rgba(14,61,58,0.03))",
    "department-incentive": "linear-gradient(135deg, rgba(200,137,61,0.06), rgba(124,92,191,0.03))",
    "bonus-vs-salary": "linear-gradient(135deg, rgba(14,61,58,0.06), rgba(124,92,191,0.04))",
    "profit-flow": "linear-gradient(135deg, rgba(34,131,90,0.06), rgba(14,61,58,0.03))",
    "department-exposure": "linear-gradient(135deg, rgba(200,137,61,0.06), rgba(14,61,58,0.03))",
    "salary-vs-departments": "linear-gradient(135deg, rgba(124,92,191,0.06), rgba(200,137,61,0.03))",
  };
  const iconColors: Record<string, string> = {
    "revenue-vs-equilibrium": "#0e3d3a",
    "previous-vs-current": "#14595a",
    "department-bonus": "#7c5cbf",
    "department-incentive": "#c8893d",
    "bonus-vs-salary": "#0e3d3a",
    "profit-flow": "#22835a",
    "department-exposure": "#c8893d",
    "salary-vs-departments": "#7c5cbf",
  };

  return (
    <div className="chart-box flex flex-col" style={{ background: headerColors[selectedChart] ?? "var(--cb-surface)" }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: iconColors[selectedChart] ?? "#0e3d3a" }}>
            {isPie ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            )}
          </div>
          <h3 className="text-sm font-semibold text-ink truncate">{chartLabel}</h3>
        </div>
        <select
          className="chart-selector flex-shrink-0"
          value={selectedChart}
          onChange={(e) => onChartChange(e.target.value as ChartType)}
          aria-label={`Select chart for slot ${chartSlot}`}
        >
          {chartOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-[200px]">{renderChart()}</div>
    </div>
  );
}

function cleanStatusLabel(status: SimulationResults["financialStatus"]): string {
  if (status === "Needs Exchange Rate") return "Awaiting Inputs";
  if (status === "Needs More Numbers") return "Awaiting Inputs";
  return status;
}

function RevenueBaseline() {
  return (
    <div className="flex h-full min-h-44 items-end px-1 pb-1">
      <div className="relative mb-1 h-px w-full bg-[#083f3c]">
        {[0, 50, 100].map((left) => (
          <span
            key={left}
            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#083f3c]"
            style={{ left: `${left}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProfitFlowSummary({
  rows,
  displayMoneyZero
}: {
  rows: { label: string; value: number; color: string }[];
  displayMoneyZero: (value: number | null) => string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="flex h-full min-h-44 flex-col justify-end">
      {rows.some((row) => row.value > 0) && (
        <div className="mb-5 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(4, (row.value / max) * 100)}%`, background: row.color }}
              />
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 items-end gap-2">
        {rows.map((row) => (
          <div key={row.label} className="text-center">
            <div className="text-[9px] leading-tight font-normal text-slate-700">{row.label}</div>
            <div className="mt-1 text-[10px] font-medium text-ink">{displayMoneyZero(row.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitRows({
  bonusExposure,
  salaryIncrementExposure,
  displayMoneyZero
}: {
  bonusExposure: number;
  salaryIncrementExposure: number;
  displayMoneyZero: (value: number | null) => string;
}) {
  const max = Math.max(bonusExposure, salaryIncrementExposure, 1);
  return (
    <div className="space-y-5">
      {[
        { label: "Bonus", value: bonusExposure },
        { label: "Salary Increment", value: salaryIncrementExposure }
      ].map((row) => (
        <div key={row.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-ink">{row.label}</span>
            <span className="font-medium text-ink">{displayMoneyZero(row.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#dfe9e6]">
            {row.value > 0 && (
              <div
                className="h-full rounded-full bg-[#0b4b46]"
                style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SimulationChartShell({
  title,
  badge,
  children
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-[#dbe5dc] bg-white p-5 shadow-[0_16px_30px_rgba(15,61,58,0.1)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {badge && (
          <span className="rounded-full bg-[#eef1ec] px-3 py-1 text-xs font-normal text-[#405a4d]">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function CompactValueBar({
  label,
  value,
  formatted,
  max,
  color
}: {
  label: string;
  value: number;
  formatted: string;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.min(100, Math.max(6, (value / max) * 100)) : 6;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-ink">{formatted}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

export function SimulationChartGrid({
  results,
  assumptions,
  directCostsKsh,
  salaryPayoutsKsh,
  displayMoneyZero
}: {
  results: SimulationResults;
  assumptions: SelectedIncentiveAssumption[];
  directCostsKsh: number | null;
  salaryPayoutsKsh: number | null;
  displayMoneyZero: (value: number | null) => string;
}) {
  const departmentExposure = assumptions.reduce<Record<string, number>>((totals, assumption) => {
    const department = assumption.ruleSnapshot.department;
    totals[department] = (totals[department] ?? 0) + assumption.estimatedExposureKsh;
    return totals;
  }, {});
  const departmentEntries = Object.entries(departmentExposure).filter(([, value]) => value > 0);
  const bonusExposure = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType !== "Salary Increment")
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  const salaryIncrementExposure = assumptions
    .filter((assumption) => assumption.ruleSnapshot.incentiveType === "Salary Increment" || assumption.ruleSnapshot.isPermanentSalaryIncrement)
    .reduce((total, assumption) => total + assumption.estimatedExposureKsh, 0);
  const revenueValue = results.revenueKsh ?? 0;
  const equilibriumValue = results.equilibriumRevenueKsh ?? 0;
  const revenueMax = Math.max(revenueValue, equilibriumValue, 1);
  const profitRows = [
    { label: "Revenue", value: revenueValue, color: "#14b8a6" },
    { label: "Costs", value: directCostsKsh ?? 0, color: "#94a3b8" },
    { label: "Salary Payouts", value: salaryPayoutsKsh ?? 0, color: "#0f766e" },
    { label: "Incentives", value: results.totalIncentiveExposureKsh ?? 0, color: "#c8893d" },
    { label: "Protected Profit", value: results.profitToProtectKsh ?? 0, color: "#115e59" }
  ];
  const departmentMax = Math.max(...departmentEntries.map(([, value]) => value), 1);

  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <SimulationChartShell title="Revenue vs Equilibrium" badge="Threshold">
        {revenueValue > 0 || equilibriumValue > 0 ? (
          <div className="space-y-5">
            <CompactValueBar label="Revenue" value={revenueValue} formatted={displayMoneyZero(results.revenueKsh)} max={revenueMax} color="#14b8a6" />
            <CompactValueBar label="Equilibrium" value={equilibriumValue} formatted={displayMoneyZero(results.equilibriumRevenueKsh)} max={revenueMax} color="#c8893d" />
          </div>
        ) : (
          <RevenueBaseline />
        )}
      </SimulationChartShell>

      <SimulationChartShell title="Incentive Exposure by Department" badge={`${departmentEntries.length} dept`}>
        {departmentEntries.length > 0 ? (
          <div className="space-y-3">
            {departmentEntries.slice(0, 5).map(([department, value], index) => (
              <CompactValueBar
                key={department}
                label={department}
                value={value}
                formatted={displayMoneyZero(value)}
                max={departmentMax}
                color={CHART_COLORS.departments[index % CHART_COLORS.departments.length]}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-44" aria-label="No active department exposure yet" />
        )}
      </SimulationChartShell>

      <SimulationChartShell title="Profit Flow" badge={cleanStatusLabel(results.financialStatus)}>
        <ProfitFlowSummary rows={profitRows} displayMoneyZero={displayMoneyZero} />
      </SimulationChartShell>

      <SimulationChartShell title="Bonus vs Salary Increment" badge="Split">
        <SplitRows
          bonusExposure={bonusExposure}
          salaryIncrementExposure={salaryIncrementExposure}
          displayMoneyZero={displayMoneyZero}
        />
      </SimulationChartShell>
    </section>
  );
}

function SimulationMetricCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06413d] via-[#0b5f58] to-[#0f766e] p-5 text-white shadow-[0_18px_34px_rgba(6,65,61,0.22)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/8" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{label}</p>
      <strong className="mt-2 block text-2xl font-medium leading-tight">{value}</strong>
      <p className="mt-2 text-[11px] font-normal text-white/80">{subtext}</p>
    </div>
  );
}

function SimulationMetricCards({
  results,
  plannedRuleCount,
  displayMoney,
  displayMoneyDash
}: {
  results: SimulationResults;
  plannedRuleCount: number;
  displayMoney: (value: number | null) => string;
  displayMoneyDash: (value: number | null) => string;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <SimulationMetricCard
        label="Total Incentive Exposure"
        value={displayMoney(results.totalIncentiveExposureKsh)}
        subtext={`${plannedRuleCount} planned incentive rules`}
      />
      <SimulationMetricCard
        label="Profit Before Incentives"
        value={displayMoneyDash(results.profitBeforeIncentivesKsh)}
        subtext="Needs revenue and cost inputs"
      />
      <SimulationMetricCard
        label="Profit After Incentives"
        value={displayMoneyDash(results.profitAfterIncentivesKsh)}
        subtext="Calculated after incentive exposure"
      />
      <SimulationMetricCard
        label="Equilibrium Revenue"
        value={displayMoneyDash(results.equilibriumRevenueKsh)}
        subtext="Minimum revenue threshold"
      />
      <SimulationMetricCard
        label="Additional Revenue Needed"
        value={displayMoneyDash(results.additionalRevenueNeededKsh)}
        subtext="Needed to stay above protected profit"
      />
      <SimulationMetricCard
        label="Affordability Status"
        value={cleanStatusLabel(results.financialStatus)}
        subtext={cleanStatusLabel(results.financialStatus).includes("Inputs") ? "Complete missing inputs" : "Based on current simulation"}
      />
    </section>
  );
}

function ScenarioSummary({ results, displayMoney }: { results: SimulationResults; displayMoney: (v: number | null) => string }) {
  const status = results.financialStatus;
  const statusColor = status === "Safe" ? "safe" : status === "Risky" ? "risk" : status === "Close" ? "warn" : "info";
  const statusLabel = cleanStatusLabel(status);

  return (
    <section className="compact-panel p-5 stagger-7">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-ink">Scenario Summary</h3>
        <span className={`badge badge-${statusColor}`}>
          <StatusIcon status={status} />
          <span className="ml-1">{statusLabel}</span>
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-sage-soft p-3">
          <div className="text-xs font-medium uppercase text-slate-500">Total Exposure</div>
          <div className="mt-1 text-lg font-medium text-dark-teal">{displayMoney(results.totalIncentiveExposureKsh)}</div>
        </div>
        <div className="rounded-xl bg-sage-soft p-3">
          <div className="text-xs font-medium uppercase text-slate-500">Profit After Incentives</div>
          <div className="mt-1 text-lg font-medium text-dark-teal">{displayMoney(results.profitAfterIncentivesKsh)}</div>
        </div>
        <div className="rounded-xl bg-sage-soft p-3">
          <div className="text-xs font-medium uppercase text-slate-500">Revenue Gap</div>
          <div className="mt-1 text-lg font-medium text-dark-teal">{displayMoney(results.additionalRevenueNeededKsh)}</div>
        </div>
      </div>
    </section>
  );
}

function BehaviorRiskCheck({ results }: { results: SimulationResults }) {
  const checks = [
    {
      label: "Sustainability Ratio",
      value: results.sustainabilityRatio,
      threshold: 0.6,
      description: "Total compensation vs revenue should stay below 60%."
    },
    {
      label: "Base Salary Ratio",
      value: results.baseSalaryRatio,
      threshold: 0.4,
      description: "Base salary should stay below 40% of revenue."
    },
    {
      label: "Bonus Ratio",
      value: results.bonusRatio,
      threshold: 0.1,
      description: "Bonus exposure should stay below 10% of revenue."
    },
    {
      label: "Salary Increment Ratio",
      value: results.salaryIncrementRatio,
      threshold: 0.1,
      description: "Salary increment exposure should stay below 10% of revenue."
    }
  ];

  return (
    <section className="compact-panel p-5 stagger-8">
      <h3 className="text-lg font-semibold text-ink mb-4">Simple Behavior-Risk Check</h3>
      <div className="space-y-3">
        {checks.map((check) => {
          const hasValue = isFiniteNumber(check.value);
          const isAbove = hasValue && check.value! > check.threshold;
          const statusClass = !hasValue ? "bg-slate-50 border-slate-200" : isAbove ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200";
          const textClass = !hasValue ? "text-slate-500" : isAbove ? "text-red-700" : "text-emerald-700";
          return (
            <div key={check.label} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${statusClass}`}>
              <div>
                <div className={`text-sm font-medium ${textClass}`}>{check.label}</div>
                <div className="text-xs text-slate-500">{check.description}</div>
              </div>
              <div className={`text-sm font-medium ${textClass}`}>
                {hasValue ? ratioLabel(check.value) : "—"}
              </div>
            </div>
          );
        })}
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
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal">Qualifying Employees</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">{rule.ruleName}</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 rounded-2xl border border-line bg-sage-soft p-4 text-sm md:grid-cols-2">
            <div><span className="font-medium text-slate-600">Department:</span> {rule.department}</div>
            <div><span className="font-medium text-slate-600">Payout:</span> <span className="font-medium">{summarizePayout(rule)}</span></div>
            <div><span className="font-medium text-slate-600">Frequency:</span> {rule.payoutFrequency || rule.triggerFrequency || "Configured by rule"}</div>
            <div><span className="font-medium text-slate-600">Currency:</span> {rule.currency ?? rule.maxPayoutCurrency ?? "Configured by rule"}</div>
            <div><span className="font-medium text-slate-600">Formula type:</span> {rule.formulaType ?? "fixed"}</div>
            <div><span className="font-medium text-slate-600">Estimated exposure:</span> <span className="font-medium">{formatRuleCurrency(exposure.exposureKsh, "KSH")}</span></div>
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
            <label className="text-xs font-normal uppercase tracking-[0.1em] text-slate-600">Note optional</label>
            <textarea className="input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>

          {exposure.warning && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{exposure.warning}</p>
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

function QualifyingEmployeesSection({
  activeRules,
  selectedRuleId,
  onSelectRuleId,
  onOpenSelectedRule,
  assumptions,
  displayMoney,
  onEditAssumption,
  onRemoveAssumption,
  collapsible = false
}: {
  activeRules: IncentiveRule[];
  selectedRuleId: string;
  onSelectRuleId: (id: string) => void;
  onOpenSelectedRule: () => void;
  assumptions: SelectedIncentiveAssumption[];
  displayMoney: (value: number | null) => string;
  onEditAssumption: (assumption: SelectedIncentiveAssumption) => void;
  onRemoveAssumption: (id: string) => void;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsible);
  const showBody = !collapsible || expanded;

  return (
    <section className={collapsible ? "panel p-4 stagger-3" : "panel p-5 stagger-3"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              aria-label={expanded ? "Collapse Incentive Qualifying Employees" : "Expand Incentive Qualifying Employees"}
              aria-expanded={expanded}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-white text-slate-500 transition-colors hover:bg-sage-soft"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
          <div>
            <h3 className={collapsible ? "text-base font-semibold text-ink" : "text-2xl font-semibold text-ink"}>Incentive Qualifying Employees</h3>
            <p className={collapsible ? "mt-0.5 text-xs font-normal text-slate-500" : "mt-1 text-sm text-slate-600"}>
              Select active incentive rules and enter how many employees, claims, clients, views, or milestones qualify.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          {activeRules.length === 0 ? (
            <p className="rounded-xl border border-line bg-sage-soft px-3 py-2 text-sm font-medium text-slate-700">
              No active incentive rules found. Add rules in Set Incentives first.
            </p>
          ) : (
            <>
              <select className="input min-w-72 font-medium" value={selectedRuleId} onChange={(event) => onSelectRuleId(event.target.value)}>
                <option value="">Select Incentive</option>
                {activeRules.map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.ruleName}</option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={onOpenSelectedRule} disabled={!selectedRuleId}>Select Incentive</button>
            </>
          )}
        </div>
      </div>

      {showBody && (
      <>
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
            {assumptions.map((assumption) => (
              <tr key={assumption.id}>
                <td>
                  <div className="font-semibold text-ink">{assumption.ruleSnapshot.ruleName}</div>
                  {assumption.warning && <div className="mt-1 text-xs font-normal text-amber-700">{assumption.warning}</div>}
                </td>
                <td><span className="badge">{assumption.ruleSnapshot.department}</span></td>
                <td>
                  <span className={`badge ${assumption.ruleSnapshot.incentiveType === "Salary Increment" ? "badge-info" : assumption.ruleSnapshot.incentiveType === "Bonus" ? "badge-safe" : ""}`}>
                    {assumption.ruleSnapshot.incentiveType}
                  </span>
                </td>
                <td><span className="font-medium text-dark-teal">{summarizePayout(assumption.ruleSnapshot)}</span></td>
                <td>{assumption.ruleSnapshot.payoutFrequency || assumption.ruleSnapshot.triggerFrequency || "Configured by rule"}</td>
                <td>
                  <span className="font-medium">{assumption.qualifyingCount}</span>
                  {isFiniteNumber(assumption.metricValue) && <span> | metric {assumption.metricValue}</span>}
                  {isFiniteNumber(assumption.collectionPercentage) && <span> | collection {assumption.collectionPercentage}%</span>}
                </td>
                <td><span className="font-medium text-dark-teal">{displayMoney(assumption.estimatedExposureKsh)}</span></td>
                <td>
                  <button
                    className="btn btn-secondary px-3 py-2 text-xs"
                    type="button"
                    onClick={() => onEditAssumption(assumption)}
                  >
                    Edit
                  </button>
                </td>
                <td>
                  <button className="btn btn-ghost px-3 py-2 text-xs" type="button" onClick={() => onRemoveAssumption(assumption.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assumptions.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-6 text-center">
          <div className="empty-state-icon mx-auto mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v-2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No incentive assumptions added yet.</p>
          <p className="mt-1 text-xs text-slate-400">Select an active incentive rule above to begin.</p>
        </div>
      )}
      </>
      )}
    </section>
  );
}

export function SimulationClient({
  rules,
  hideDetails = false,
  darkHero = false,
  hideHero = false,
  onlyQualifyingEmployees = false,
  onAssumptionsChange
}: {
  rules: IncentiveRule[];
  hideDetails?: boolean;
  darkHero?: boolean;
  hideHero?: boolean;
  onlyQualifyingEmployees?: boolean;
  /** Optional: notified whenever the recalculated assumptions change. Used to surface live
   *  exposure data to a parent (e.g. the Dashboard) without altering this component's own state/behavior. */
  onAssumptionsChange?: (assumptions: SelectedIncentiveAssumption[]) => void;
}) {
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

  useEffect(() => {
    onAssumptionsChange?.(recalculatedAssumptions);
  }, [recalculatedAssumptions, onAssumptionsChange]);

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
    const bonusExposureKsh = calculateBonusExposure(recalculatedAssumptions);
    const salaryIncrementExposureKsh = calculateSalaryIncrementExposure(recalculatedAssumptions);
    const totalCompensationCostKsh = calculateTotalCompensationCost(salaryPayoutsKsh, bonusExposureKsh, salaryIncrementExposureKsh);
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
      bonusExposureKsh,
      salaryIncrementExposureKsh,
      totalCompensationCostKsh,
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
  const zeroMoney = controls.currencyDisplay === "USD" ? "$0" : "KSh 0";
  const displayMoneyZero = (value: number | null) => {
    if (!isFiniteNumber(value) || value === 0) return zeroMoney;
    const formatted = displayMoney(value);
    return formatted === "Needs rate" ? "Awaiting rate" : formatted;
  };
  const displayMoneyDash = (value: number | null) => {
    if (!isFiniteNumber(value)) return "—";
    const formatted = displayMoney(value);
    return formatted === "Needs rate" ? "—" : formatted;
  };
  const directCostsKsh = controls.directCosts === "" ? null : toKsh(controls.directCosts, inputCurrency, exchangeRate);
  const salaryPayoutsKsh = controls.salaryPayouts === "" ? null : toKsh(controls.salaryPayouts, inputCurrency, exchangeRate);
  const statusTone = results.financialStatus === "Risky" ? "risk" : results.financialStatus === "Safe" ? "safe" : results.financialStatus === "Close" ? "close" : undefined;

  const qualifyingEmployeesSection = (
    <QualifyingEmployeesSection
      activeRules={activeRules}
      selectedRuleId={selectedRuleId}
      onSelectRuleId={setSelectedRuleId}
      onOpenSelectedRule={openSelectedRule}
      assumptions={recalculatedAssumptions}
      displayMoney={displayMoney}
      onEditAssumption={(assumption) => {
        setEditingAssumption(assumption);
        setModalRule(assumption.ruleSnapshot);
      }}
      onRemoveAssumption={(id) => setAssumptions((current) => current.filter((item) => item.id !== id))}
      collapsible={onlyQualifyingEmployees}
    />
  );

  return (
    <div className="space-y-5 bg-[#fbfdfb] p-5 lg:p-8">
      {!hideHero && (
      <section className={`overflow-hidden rounded-2xl border p-5 stagger-1 ${darkHero ? "border-[#0d3f3b]/25 bg-gradient-to-br from-white via-[#f0faf9] to-[#0d3f3b] shadow-[0_18px_40px_rgba(6,65,61,0.18)]" : "border-teal-50 bg-gradient-to-br from-white via-white to-teal-50 shadow-[0_18px_40px_rgba(15,118,110,0.08)]"}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`bg-gradient-to-r bg-clip-text text-3xl font-semibold text-transparent ${darkHero ? "from-[#0f766e] to-[#042f2e]" : "from-[#14b8a6] to-[#0f3d3a]"}`}>
                Incentive Simulation
              </h2>
              <span className={`badge ${statusTone === "safe" ? "badge-safe" : statusTone === "risk" ? "badge-risk" : statusTone === "close" ? "badge-warn" : ""}`}>
                <StatusIcon status={results.financialStatus} />
                <span className="ml-1">{cleanStatusLabel(results.financialStatus)}</span>
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Estimate incentive exposure, protected profit, safe payout capacity, and revenue gaps from active Set
              Incentives rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="input h-10 min-w-56 font-medium" value={selectedScenarioId} onChange={(event) => loadScenario(event.target.value)}>
              <option value="">Saved scenarios</option>
              {savedScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
              ))}
            </select>
            <button className="btn btn-secondary" type="button" onClick={saveScenario}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Scenario
            </button>
            <button className="btn btn-ghost" type="button" onClick={resetSimulation}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              Reset
            </button>
          </div>
        </div>
      </section>
      )}

      {onlyQualifyingEmployees ? (
        qualifyingEmployeesSection
      ) : (
      !hideDetails && (
      <>
      <SimulationChartGrid
        results={results}
        assumptions={recalculatedAssumptions}
        directCostsKsh={directCostsKsh}
        salaryPayoutsKsh={salaryPayoutsKsh}
        displayMoneyZero={displayMoneyZero}
      />

      <SimulationMetricCards
        results={results}
        plannedRuleCount={recalculatedAssumptions.length}
        displayMoney={displayMoneyZero}
        displayMoneyDash={displayMoneyDash}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 stagger-2">
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
          <label className="text-xs font-medium uppercase tracking-[0.1em] text-slate-600">Exchange Rate</label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">1 USD =</span>
            <input
              className="input h-10 min-w-0 px-2 text-center font-medium text-dark-teal"
              value={controls.exchangeRate}
              onChange={(event) => updateControl("exchangeRate", parseNumericInput(event.target.value))}
              inputMode="decimal"
            />
            <span className="text-xs font-medium text-slate-600">KSh</span>
          </div>
          <button className="mt-2 w-full rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-dark-teal hover:bg-sage-soft transition-colors" type="button" onClick={fetchLatestRate}>
            Fetch latest
          </button>
          <p className="mt-1 text-xs font-normal text-slate-500">{currencyMessage}</p>
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
          <label className="text-xs font-medium uppercase tracking-[0.1em] text-slate-600">Close Buffer</label>
          <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
            <input className="input h-10 font-medium text-dark-teal" value={controls.closeBuffer} onChange={(event) => updateControl("closeBuffer", parseNumericInput(event.target.value))} />
            <select className="input h-10 font-medium text-dark-teal" value={controls.closeBufferMode} onChange={(event) => updateControl("closeBufferMode", event.target.value as "amount" | "percent")}>
              <option value="amount">Amount</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>
      </section>

      {qualifyingEmployeesSection}

      <ScenarioSummary results={results} displayMoney={displayMoney} />

      <BehaviorRiskCheck results={results} />

      <section className="compact-panel p-4 stagger-8">
        <p className="text-sm font-normal leading-6 text-slate-600">{scenarioStorageNote}</p>
      </section>
      </>
      )
      )}

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
