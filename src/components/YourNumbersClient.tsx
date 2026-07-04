"use client";

import { useMemo } from "react";
import { DashboardNumberCards } from "@/components/DashboardNumberCards";
import { useDashboardState } from "@/lib/dashboard-state-context";
import { computeDashboardResults } from "@/lib/dashboard-metrics-adapter";
import { calculateTotalIncentiveExposure } from "@/lib/simulation-formulas";
import { buildDashboardNumberCards } from "@/lib/dashboard-explanations-adapter";

export function YourNumbersClient() {
  const { revenue, totalCosts, salaryPayouts, profitToProtect, currencyDisplay, assumptions } = useDashboardState();

  const hasRealData = revenue > 0 || totalCosts > 0 || salaryPayouts > 0 || profitToProtect > 0;

  // Reuses the exact same existing formulas/adapters the Dashboard uses — no new
  // calculation logic, just read from the shared live state.
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

  const cards = useMemo(
    () => buildDashboardNumberCards({ results, currencyDisplay, assumptions, hasRealData }),
    [results, currencyDisplay, assumptions, hasRealData]
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white px-5 py-5 lg:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Your Numbers</h2>
        <p className="mt-0.5 text-xs font-normal text-slate-500">
          Live calculated values from your current Dashboard variables, with a short explanation for each.
        </p>
      </header>

      <div className="p-5 lg:p-8">
        <DashboardNumberCards cards={cards} hasRealData={hasRealData} />
      </div>
    </div>
  );
}
