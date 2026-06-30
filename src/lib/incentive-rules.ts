import { formatRuleCurrency } from "./currency";
import { seededIncentiveRules } from "./seed-rules";
import type {
  Department,
  IncentiveRule,
  RuleCategory,
  RuleStatus,
  RuleTemplate,
  RuleValidationResult
} from "./types";

export const incentiveRules = seededIncentiveRules;

export function getActiveRules(rules: IncentiveRule[] = incentiveRules): IncentiveRule[] {
  return rules.filter((rule) => rule.isActive && rule.status === "Active");
}

export function getRuleById(ruleId: string, rules: IncentiveRule[] = incentiveRules): IncentiveRule | undefined {
  return rules.find((rule) => rule.id === ruleId);
}

export function getRuleCountByDepartment(rules: IncentiveRule[] = incentiveRules): Record<string, number> {
  return rules.reduce<Record<string, number>>((counts, rule) => {
    counts[rule.department] = (counts[rule.department] ?? 0) + 1;
    return counts;
  }, {});
}

export function getRuleCategories(rules: IncentiveRule[] = incentiveRules): RuleCategory[] {
  return Array.from(new Set(rules.map((rule) => rule.ruleCategory))).sort();
}

export function getRuleStatuses(rules: IncentiveRule[] = incentiveRules): RuleStatus[] {
  return Array.from(new Set(rules.map((rule) => rule.status))).sort();
}

export function summarizeTrigger(rule: IncentiveRule): string {
  const metric = rule.triggerMetric || rule.triggerType;
  const threshold =
    rule.triggerThresholdValue !== undefined && rule.triggerThresholdValue !== null
      ? ` ${rule.triggerComparison ?? ""} ${rule.triggerThresholdValue} ${rule.triggerThresholdUnit ?? ""}`.trim()
      : "";
  return [metric, threshold, rule.triggerPeriod].filter(Boolean).join(" | ");
}

export function summarizePayout(rule: IncentiveRule): string {
  if (rule.payoutType === "not-specified") return "Counts toward threshold";
  if (rule.payoutType === "percentage") return `${rule.percentageRate ?? 0}% of billed/base amount`;
  if (rule.payoutType === "billing") {
    return `Up to ${formatRuleCurrency(rule.maxPayoutAmount, rule.maxPayoutCurrency)}`;
  }
  if (rule.formulaType === "marketing_view_blocks") {
    const face = Number(rule.formulaVariables?.facePersonReward ?? 0);
    const editor = Number(rule.formulaVariables?.editorReward ?? 0);
    return `${formatRuleCurrency(face, "KSH")} face/person, ${formatRuleCurrency(editor, "KSH")} editor`;
  }
  if (rule.payoutType === "split") {
    return `${formatRuleCurrency(rule.amount, rule.currency)} ${rule.splitRole ?? "primary"}; ${formatRuleCurrency(
      rule.splitAmount,
      rule.splitCurrency
    )} separate support claim`;
  }
  return formatRuleCurrency(rule.amount, rule.currency);
}

export function createRulePreview(rule: IncentiveRule): string {
  if (rule.ruleKey === "sales-ten-client-salary-milestone") {
    return "If a Sales employee reaches every 10 active/paying clients after July 2026, create a KSh 5,000 permanent monthly salary increment review.";
  }
  if (rule.ruleKey === "tax-1040-additional-reward") {
    return "If a 1040 return is EF accepted, paid, and billed over $250, pay an additional KSh 500.";
  }
  if (rule.formulaType === "marketing_view_blocks") {
    const threshold = rule.formulaVariables?.viewThreshold;
    const face = rule.formulaVariables?.facePersonReward;
    const editor = rule.formulaVariables?.editorReward;
    return `For every full ${threshold} ${rule.platform ?? "platform"} views, pay KSh ${face} to the face/person and KSh ${editor} to the editor.`;
  }
  if (rule.formulaType === "billing_collection") {
    return `If billing collection reaches ${rule.formulaVariables?.fullPayoutPercent}%, pay up to ${summarizePayout(rule)}.`;
  }
  return `When ${summarizeTrigger(rule)}, payout is ${summarizePayout(rule)} at ${rule.payoutFrequency ?? "the configured frequency"}.`;
}

export function validateIncentiveRule(rule: IncentiveRule): RuleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule.ruleName.trim()) errors.push("Rule name is required.");
  if (!rule.department) errors.push("Department is required.");

  const amountRequired = !["not-specified", "percentage", "billing"].includes(rule.payoutType);
  if (amountRequired && (rule.amount === undefined || rule.amount === null)) {
    errors.push("Amount is required unless payout is not specified.");
  }
  if (rule.amount !== undefined && rule.amount !== null && !rule.currency) {
    errors.push("Currency is required when an amount exists.");
  }
  if (rule.automaticTriggerEnabled && (rule.triggerThresholdValue === undefined || rule.triggerThresholdValue === null)) {
    errors.push("Trigger threshold is required when automatic trigger is enabled.");
  }
  if (rule.percentageRate !== undefined && rule.percentageRate !== null) {
    if (rule.percentageRate < 0 || rule.percentageRate > 100) {
      errors.push("Percentage must be between 0 and 100.");
    }
  }
  if (rule.triggerThresholdValue !== undefined && rule.triggerThresholdValue !== null && rule.triggerThresholdValue < 0) {
    errors.push("Thresholds cannot be negative.");
  }
  if (rule.formulaType === "billing_collection") {
    const floor = Number(rule.formulaVariables?.collectionFloorPercent);
    const full = Number(rule.formulaVariables?.fullPayoutPercent);
    if (Number.isFinite(floor) && Number.isFinite(full) && full <= floor) {
      errors.push("Full payout percent must be greater than collection floor.");
    }
  }
  if (!rule.formulaKey) warnings.push("Formula key is not configured yet.");

  return { isValid: errors.length === 0, errors, warnings };
}

export function makeRuleFromTemplate(template: RuleTemplate): IncentiveRule {
  const now = new Date().toISOString();
  const slug = template.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const departmentByTemplate: Partial<Record<RuleTemplate, Department>> = {
    "Sales Rule": "Sales",
    "Payroll Rule": "Payroll",
    "Bookkeeping Rule": "Bookkeeping",
    "Taxes Rule": "Taxes",
    "Billing Rule": "Billing",
    "Marketing Rule": "Marketing",
    "Processes Rule": "Processes",
    "EA Exam Rule": "EA / Tax Professional",
    "Referral Rule": "Any",
    "Salary Increment Rule": "Any",
    "Custom Rule": "Other"
  };

  return {
    id: `draft-${slug}-${Date.now()}`,
    ruleKey: `draft-${slug}`,
    ruleName: template.replace(" Rule", ""),
    description: "",
    department: departmentByTemplate[template] ?? "Other",
    claimType: template === "Salary Increment Rule" ? "Manager Verified" : "Employee Claim",
    ruleCategory: template === "Referral Rule" ? "Referral" : template === "Salary Increment Rule" ? "Salary Increment" : "Custom",
    incentiveType: template === "Salary Increment Rule" ? "Salary Increment" : "Bonus",
    status: "Draft",
    isActive: false,
    triggerType: "",
    triggerMetric: "",
    triggerComparison: "greater_than_or_equal",
    triggerThresholdValue: null,
    triggerThresholdUnit: "",
    triggerFrequency: "",
    payoutType: template === "Billing Rule" ? "billing" : "fixed",
    amount: null,
    currency: "KSH",
    payoutFrequency: "",
    formulaType: template === "Billing Rule" ? "billing_collection" : "fixed",
    formulaKey: "",
    formulaVariables: {},
    employeeBasedOrTeamBased: "Employee",
    requiresApproval: false,
    requiresEvidence: false,
    createdByName: "CareBearBooks Admin",
    effectiveDate: new Date().toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now
  };
}
