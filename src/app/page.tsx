import Link from "next/link";
import { getActiveRules, getRuleCountByDepartment, incentiveRules } from "@/lib/incentive-rules";

function DashboardPieChart({
  segments,
  size = 140,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;
  const center = size / 2;
  const radius = (size / 2) - 6;
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
        <circle cx={center} cy={center} r={radius * 0.42} fill="white" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {arcs.map((arc, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: arc.color }} />
            <span>{arc.label}</span>
            <span className="text-slate-400">{arc.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardBarChart({
  bars,
}: {
  bars: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="space-y-2.5">
      {bars.map((bar, index) => (
        <div key={index}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: bar.color }} />
              {bar.label}
            </span>
            <span className="font-black text-dark-teal">{bar.value}</span>
          </div>
          <div className="h-3.5 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.4)" }}>
            <div
              className="h-full rounded-full bar-animated"
              style={{ width: `${max > 0 ? Math.min(100, (bar.value / max) * 100) : 0}%`, background: bar.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const activeRules = getActiveRules();
  const departmentCounts = getRuleCountByDepartment();
  const salaryRules = activeRules.filter((rule) => rule.incentiveType === "Salary Increment").length;
  const formulaRules = activeRules.filter((rule) => rule.incentiveType === "Formula").length;
  const bonusRules = activeRules.filter((rule) => rule.incentiveType === "Bonus").length;

  const departmentColors: Record<string, string> = {
    Sales: "#0e3d3a",
    Payroll: "#14595a",
    Bookkeeping: "#c8893d",
    Processes: "#7c5cbf",
    Taxes: "#2c5d7a",
    Billing: "#244c3a",
    Marketing: "#8a3d35",
    "EA / Tax Professional": "#5d6657",
    "Admin / Management": "#1d7c7c",
    Other: "#9aa39a",
    Any: "#0a2d2a"
  };

  const departmentEntries = Object.entries(departmentCounts);
  const topDepartments = departmentEntries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <section className="panel p-5 lg:p-6 stagger-1">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal">CareBearBooks</p>
              <span className="badge badge-safe">Active</span>
            </div>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              Standalone incentive planning model for CareBearBooks.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              This foundation keeps Set Incentives as the rule source, prepares simulation math in KSh, and creates
              the pages needed for the next prompts to connect advanced projections, charts, and scenario persistence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link href="/set-incentives" className="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              Set Incentives
            </Link>
            <Link href="/incentive-simulation" className="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Incentive Simulation
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 stagger-2">
        <div className="result-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Seeded Rules</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <strong>{incentiveRules.length}</strong>
        </div>
        <div className="result-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Active Rules</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <strong>{activeRules.length}</strong>
        </div>
        <div className="result-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Bonus Rules</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <strong>{bonusRules}</strong>
        </div>
        <div className="result-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Salary Increment Rules</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <strong>{salaryRules}</strong>
        </div>
        <div className="result-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Formula Rules</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <strong>{formulaRules}</strong>
        </div>
      </section>

      <section className="stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #0e3d3a, #14595a)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <h3 className="text-xl font-black text-ink">Visual Analytics</h3>
          <span className="badge badge-info">Live Data</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="chart-box">
            <div className="chart-card-header" style={{ background: "linear-gradient(135deg, rgba(14,61,58,0.06), rgba(20,89,90,0.04))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-dark-teal">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                  <h4 className="text-sm font-black text-ink">Incentive Distribution by Type</h4>
                </div>
                <span className="badge">{activeRules.length} rules</span>
              </div>
            </div>
            <DashboardPieChart
              segments={[
                { label: "Bonus", value: bonusRules, color: "#0e3d3a" },
                { label: "Salary Increment", value: salaryRules, color: "#7c5cbf" },
                { label: "Formula", value: formulaRules, color: "#c8893d" },
              ]}
            />
          </div>

          <div className="chart-box">
            <div className="chart-card-header" style={{ background: "linear-gradient(135deg, rgba(200,137,61,0.06), rgba(124,92,191,0.04))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#c8893d" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                  </div>
                  <h4 className="text-sm font-black text-ink">Rules by Department</h4>
                </div>
                <span className="badge">{departmentEntries.length} depts</span>
              </div>
            </div>
            <DashboardBarChart
              bars={topDepartments.map(([dept, count]) => ({
                label: dept,
                value: count,
                color: departmentColors[dept] ?? "#9aa39a",
              }))}
            />
          </div>

          <div className="chart-box">
            <div className="chart-card-header" style={{ background: "linear-gradient(135deg, rgba(34,131,90,0.06), rgba(14,61,58,0.04))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#22835a" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  </div>
                  <h4 className="text-sm font-black text-ink">Revenue vs Equilibrium</h4>
                </div>
                <span className="badge badge-warn">Needs Sim</span>
              </div>
            </div>
            <div className="chart-preview-state">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#0e3d3a", opacity: 0.4 }} />
                      Current Revenue
                    </span>
                    <span>—</span>
                  </div>
                  <div className="h-3.5 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
                    <div className="h-full rounded-full" style={{ width: "75%", background: "linear-gradient(90deg, rgba(14,61,58,0.2), rgba(14,61,58,0.08))" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#c8893d", opacity: 0.4 }} />
                      Equilibrium Revenue
                    </span>
                    <span>—</span>
                  </div>
                  <div className="h-3.5 rounded-full overflow-hidden" style={{ background: "rgba(210,224,221,0.3)" }}>
                    <div className="h-full rounded-full" style={{ width: "55%", background: "linear-gradient(90deg, rgba(200,137,61,0.2), rgba(200,137,61,0.08))" }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span className="text-xs font-semibold text-slate-400">Run a simulation to populate this chart with real data</span>
              </div>
            </div>
          </div>

          <div className="chart-box">
            <div className="chart-card-header" style={{ background: "linear-gradient(135deg, rgba(124,92,191,0.06), rgba(14,61,58,0.04))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#7c5cbf" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <h4 className="text-sm font-black text-ink">Department Bonus Payouts</h4>
                </div>
                <span className="badge badge-warn">Needs Sim</span>
              </div>
            </div>
            <div className="chart-preview-state">
              <div className="flex items-center justify-center py-3">
                <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Preview pie chart">
                  <path d="M 60 8 A 52 52 0 0 1 108 72 L 60 60 Z" fill="rgba(14,61,58,0.12)" stroke="white" strokeWidth="2" />
                  <path d="M 108 72 A 52 52 0 0 1 30 104 L 60 60 Z" fill="rgba(200,137,61,0.12)" stroke="white" strokeWidth="2" />
                  <path d="M 30 104 A 52 52 0 0 1 12 48 L 60 60 Z" fill="rgba(124,92,191,0.12)" stroke="white" strokeWidth="2" />
                  <path d="M 12 48 A 52 52 0 0 1 60 8 L 60 60 Z" fill="rgba(44,93,122,0.12)" stroke="white" strokeWidth="2" />
                  <circle cx="60" cy="60" r="22" fill="white" />
                </svg>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
                {["Sales", "Taxes", "Bookkeeping", "Payroll"].map((dept, i) => (
                  <div key={dept} className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: [departmentColors.Sales, departmentColors.Taxes, departmentColors.Bookkeeping, departmentColors.Payroll][i], opacity: 0.35 }} />
                    <span>{dept}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span className="text-xs font-semibold text-slate-400">Add qualifying employees in the simulation to see payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] stagger-4">
        <div className="compact-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <h3 className="text-lg font-black text-ink">Model Direction</h3>
          </div>
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <div className="rounded-xl bg-sage-soft px-3 py-2.5 border border-line">
              <div className="font-bold text-dark-teal mb-0.5">Affordability Analysis</div>
              Calculations are prepared to answer affordability, protected profit, exposure, and revenue gap questions.
            </div>
            <div className="rounded-xl bg-sage-soft px-3 py-2.5 border border-line">
              <div className="font-bold text-dark-teal mb-0.5">Currency Conversion</div>
              Currency conversion is isolated behind a server route and manual exchange rate fallback.
            </div>
            <div className="rounded-xl bg-sage-soft px-3 py-2.5 border border-line">
              <div className="font-bold text-dark-teal mb-0.5">Scenario Persistence</div>
              Scenario saving uses a server-compatible abstraction so it can later move to a database.
            </div>
          </div>
        </div>
        <div className="compact-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <h3 className="text-lg font-black text-ink">Rules By Department</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(departmentCounts).map(([department, count]) => (
              <div key={department} className="flex items-center justify-between rounded-xl border border-line bg-sage-soft px-3 py-2.5 transition-all hover:shadow-sm hover:border-sage">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: departmentColors[department] ?? "#9aa39a" }} />
                  <span className="text-sm font-bold text-slate-700">{department}</span>
                </div>
                <span className="badge">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="compact-panel p-5 stagger-5">
        <div className="flex items-center gap-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          <h3 className="text-lg font-black text-ink">Quick Actions</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/incentive-simulation" className="flex items-center gap-3 rounded-xl border border-line bg-sage-soft px-4 py-3 transition-all hover:shadow-md hover:border-sage group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-line shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <div className="text-sm font-black text-ink">Run Simulation</div>
              <div className="text-xs text-slate-500">Test incentive scenarios</div>
            </div>
          </Link>
          <Link href="/set-incentives" className="flex items-center gap-3 rounded-xl border border-line bg-sage-soft px-4 py-3 transition-all hover:shadow-md hover:border-sage group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-line shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e3d3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </div>
            <div>
              <div className="text-sm font-black text-ink">Manage Rules</div>
              <div className="text-xs text-slate-500">Add or edit incentive rules</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-white px-4 py-3 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-soft border border-line">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <div className="text-sm font-black text-slate-400">Archived Scenarios</div>
              <div className="text-xs text-slate-400">Coming soon</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
