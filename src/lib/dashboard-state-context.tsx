"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CurrencyCode, SelectedIncentiveAssumption } from "./types";

interface DashboardState {
  revenue: number;
  setRevenue: (value: number) => void;
  totalCosts: number;
  setTotalCosts: (value: number) => void;
  salaryPayouts: number;
  setSalaryPayouts: (value: number) => void;
  profitToProtect: number;
  setProfitToProtect: (value: number) => void;
  currencyDisplay: CurrencyCode;
  setCurrencyDisplay: (value: CurrencyCode) => void;
  expectedQualifying: number | "";
  setExpectedQualifying: (value: number | "") => void;
  assumptions: SelectedIncentiveAssumption[];
  setAssumptions: (value: SelectedIncentiveAssumption[]) => void;
}

const DashboardStateContext = createContext<DashboardState | null>(null);

// Shared across the Dashboard and the "Your Numbers" page so both read/write the same live
// variables — session-only (client state), same convention as before, just lifted one level
// so it survives client-side navigation between the two pages instead of resetting.
export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const [revenue, setRevenue] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);
  const [salaryPayouts, setSalaryPayouts] = useState(0);
  const [profitToProtect, setProfitToProtect] = useState(0);
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyCode>("USD");
  const [expectedQualifying, setExpectedQualifying] = useState<number | "">("");
  const [assumptions, setAssumptions] = useState<SelectedIncentiveAssumption[]>([]);

  const value = useMemo<DashboardState>(
    () => ({
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
    }),
    [revenue, totalCosts, salaryPayouts, profitToProtect, currencyDisplay, expectedQualifying, assumptions]
  );

  return <DashboardStateContext.Provider value={value}>{children}</DashboardStateContext.Provider>;
}

export function useDashboardState(): DashboardState {
  const context = useContext(DashboardStateContext);
  if (!context) {
    throw new Error("useDashboardState must be used within a DashboardStateProvider");
  }
  return context;
}
