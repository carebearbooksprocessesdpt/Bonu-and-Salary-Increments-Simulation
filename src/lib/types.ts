export type CurrencyCode = "KSH" | "USD";
export type CurrencyDisplay = "USD" | "KSH";
export type SimulationPeriod = "monthly" | "quarterly" | "annual";

export type Department =
  | "Sales"
  | "Payroll"
  | "Bookkeeping"
  | "Processes"
  | "Taxes"
  | "Billing"
  | "Marketing"
  | "EA / Tax Professional"
  | "Admin / Management"
  | "Other"
  | "Any";

export type RuleStatus = "Active" | "Inactive" | "Draft" | "Archived";

export type RuleCategory =
  | "Acquisition"
  | "Referral"
  | "Salary Increment"
  | "Accuracy"
  | "Completion"
  | "Retention"
  | "Cleanup"
  | "Tax Filing"
  | "Billing Collection"
  | "Marketing Views"
  | "Marketing Milestone"
  | "Exam"
  | "Threshold"
  | "Custom";

export type IncentiveType =
  | "Bonus"
  | "Salary Increment"
  | "Formula"
  | "Threshold"
  | "Review"
  | "Custom";

export type ClaimType =
  | "Employee Claim"
  | "Automatic Trigger"
  | "Manager Verified"
  | "Simulation Only";

export type PayoutType =
  | "fixed"
  | "percentage"
  | "milestone"
  | "billing"
  | "split"
  | "not-specified";

export type FormulaType =
  | "none"
  | "fixed"
  | "percentage"
  | "milestone"
  | "billing_collection"
  | "marketing_view_blocks"
  | "salary_milestone"
  | "threshold_only";

export type TriggerComparison =
  | "equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "between"
  | "completed";

export type RuleTemplate =
  | "Sales Rule"
  | "Payroll Rule"
  | "Bookkeeping Rule"
  | "Taxes Rule"
  | "Billing Rule"
  | "Marketing Rule"
  | "Processes Rule"
  | "EA Exam Rule"
  | "Referral Rule"
  | "Salary Increment Rule"
  | "Custom Rule";

export type RuleFormulaVariables = Record<
  string,
  string | number | boolean | string[] | number[] | null
>;

export interface IncentiveRule {
  id: string;
  ruleKey: string;
  ruleName: string;
  description: string;
  department: Department;
  workArea?: string;
  claimType: ClaimType;
  ruleCategory: RuleCategory;
  incentiveType: IncentiveType;
  status: RuleStatus;
  isActive: boolean;

  triggerType: string;
  triggerMetric?: string;
  triggerComparison?: TriggerComparison;
  triggerThresholdValue?: number | null;
  triggerThresholdUnit?: string;
  triggerPeriod?: string;
  triggerStartDate?: string;
  triggerFrequency?: string;
  automaticTriggerEnabled?: boolean;
  triggerMessage?: string;

  payoutType: PayoutType;
  amount?: number | null;
  currency?: CurrencyCode;
  percentageRate?: number | null;
  maxPayoutAmount?: number | null;
  maxPayoutCurrency?: CurrencyCode;
  payoutFrequency?: string;
  isPermanentSalaryIncrement?: boolean;
  isCumulative?: boolean;
  isUncapped?: boolean;
  isOneTime?: boolean;
  isQuarterly?: boolean;
  isMonthly?: boolean;
  repeatIntervalValue?: number | null;
  repeatIntervalUnit?: string;

  formulaType?: FormulaType;
  formulaKey?: string;
  formulaVariables?: RuleFormulaVariables;

  employeeBasedOrTeamBased?: "Employee" | "Team" | "Either";
  stackable?: boolean;
  requiresActiveClient?: boolean;
  requiresPayingClient?: boolean;
  requiresApproval?: boolean;
  requiresEvidence?: boolean;
  requiresPaymentReceived?: boolean;
  requiresEfAccepted?: boolean;
  requiresPreapproval?: boolean;
  requiresTeamLeaderVerification?: boolean;

  formType?: string;
  platform?: string;
  serviceType?: string;
  levelName?: string;
  complexityLevel?: string;
  supportType?: string;
  contributorType?: string;
  splitGroupKey?: string;
  splitRole?: string;
  splitAmount?: number | null;
  splitCurrency?: CurrencyCode;
  notes?: string;
  metadata?: RuleFormulaVariables;

  createdByName: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SimulationControls {
  revenue: number | "";
  directCosts: number | "";
  salaryPayouts: number | "";
  profitToProtect: number | "";
  currencyDisplay: CurrencyDisplay;
  exchangeRate: number | "";
  simulationPeriod: SimulationPeriod;
  closeBuffer: number | "";
  closeBufferMode: "amount" | "percent";
}

export interface SelectedIncentiveAssumption {
  id: string;
  ruleId: string;
  ruleSnapshot: IncentiveRule;
  qualifyingCount: number;
  baseAmount?: number;
  baseAmountCurrency?: CurrencyCode;
  metricValue?: number;
  collectionPercentage?: number;
  note?: string;
  estimatedExposureKsh: number;
  warning?: string;
}

export interface SimulationResults {
  revenueKsh: number | null;
  totalIncentiveExposureKsh: number | null;
  profitBeforeIncentivesKsh: number | null;
  profitAfterIncentivesKsh: number | null;
  profitToProtectKsh: number | null;
  equilibriumRevenueKsh: number | null;
  additionalRevenueNeededKsh: number | null;
  revenueSurplusKsh: number | null;
  maximumSafePayoutKsh: number | null;
  maximumSafeMonthlyIncrementKsh: number | null;
  sustainabilityRatio: number | null;
  baseSalaryRatio: number | null;
  bonusRatio: number | null;
  salaryIncrementRatio: number | null;
  bonusExposureKsh: number | null;
  salaryIncrementExposureKsh: number | null;
  totalCompensationCostKsh: number | null;
  breakEvenDays: number | null;
  financialStatus: "Needs Exchange Rate" | "Needs More Numbers" | "Risky" | "Close" | "Safe";
}

export interface SavedScenario {
  id: string;
  name: string;
  controls: SimulationControls;
  selectedIncentiveAssumptions: SelectedIncentiveAssumption[];
  selectedRuleSnapshots: IncentiveRule[];
  resultSnapshot: SimulationResults;
  createdAt: string;
}

export const departments: Department[] = [
  "Sales",
  "Payroll",
  "Bookkeeping",
  "Processes",
  "Taxes",
  "Billing",
  "Marketing",
  "EA / Tax Professional",
  "Admin / Management",
  "Other",
  "Any"
];

export const ruleTemplates: RuleTemplate[] = [
  "Sales Rule",
  "Payroll Rule",
  "Bookkeeping Rule",
  "Taxes Rule",
  "Billing Rule",
  "Marketing Rule",
  "Processes Rule",
  "EA Exam Rule",
  "Referral Rule",
  "Salary Increment Rule",
  "Custom Rule"
];
