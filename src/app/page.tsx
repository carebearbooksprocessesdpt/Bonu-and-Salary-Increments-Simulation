import Link from "next/link";
import { DashboardSimulationSection } from "@/components/DashboardSimulationSection";

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

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white px-5 py-5 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">Simulation Tool</span>
              <span className="text-xs font-normal text-slate-500">v2.4 Active</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">CareBearBooks Bonus and Salary Increments Simulation</h2>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Estimate incentive exposure, protected profit, safe payout capacity, and revenue gaps.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* TODO: Connect to shared simulator reset action when dashboard scenario state is lifted out of the simulator page. */}
            <Link href="/incentive-simulation" className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-xs font-medium text-ink transition-all hover:bg-sage-soft">
              <Icon name="refresh" />
              Reset Simulation
            </Link>
            {/* TODO: Connect to shared scenario save action when scenario persistence is available at dashboard scope. */}
            <Link href="/incentive-simulation" className="flex items-center gap-2 rounded-lg bg-[#064e4a] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#021f1e]">
              <Icon name="bookmark" />
              Save Scenario
            </Link>
          </div>
        </div>
      </header>

      <div className="p-5 lg:p-8">
        <DashboardSimulationSection />
      </div>
    </div>
  );
}
