import Link from "next/link";
import { getActiveRules, getRuleCountByDepartment, incentiveRules } from "@/lib/incentive-rules";

export default function DashboardPage() {
  const activeRules = getActiveRules();
  const departmentCounts = getRuleCountByDepartment();
  const salaryRules = activeRules.filter((rule) => rule.incentiveType === "Salary Increment").length;
  const formulaRules = activeRules.filter((rule) => rule.incentiveType === "Formula").length;

  return (
    <div className="space-y-6">
      <section className="panel p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal">Prompt 1 Foundation</p>
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
              Set Incentives
            </Link>
            <Link href="/incentive-simulation" className="btn btn-secondary">
              Incentive Simulation
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="result-card">
          <span className="text-sm font-bold text-slate-600">Seeded Rules</span>
          <strong>{incentiveRules.length}</strong>
        </div>
        <div className="result-card">
          <span className="text-sm font-bold text-slate-600">Active Rules</span>
          <strong>{activeRules.length}</strong>
        </div>
        <div className="result-card">
          <span className="text-sm font-bold text-slate-600">Salary Increment Rules</span>
          <strong>{salaryRules}</strong>
        </div>
        <div className="result-card">
          <span className="text-sm font-bold text-slate-600">Formula Rules</span>
          <strong>{formulaRules}</strong>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="compact-panel p-5">
          <h3 className="text-lg font-black text-ink">Model Direction</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p>Calculations are prepared to answer affordability, protected profit, exposure, and revenue gap questions.</p>
            <p>Currency conversion is isolated behind a server route and manual exchange rate fallback.</p>
            <p>Scenario saving uses a server-compatible abstraction so it can later move to a database.</p>
          </div>
        </div>
        <div className="compact-panel p-5">
          <h3 className="text-lg font-black text-ink">Rules By Department</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {Object.entries(departmentCounts).map(([department, count]) => (
              <div key={department} className="flex items-center justify-between rounded-xl border border-line bg-sage-soft px-3 py-2">
                <span className="text-sm font-bold text-slate-700">{department}</span>
                <span className="badge">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
