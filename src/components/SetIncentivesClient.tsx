"use client";

import { useMemo, useState } from "react";
import {
  createRulePreview,
  getRuleCategories,
  getRuleStatuses,
  makeRuleFromTemplate,
  summarizePayout,
  summarizeTrigger,
  validateIncentiveRule
} from "@/lib/incentive-rules";
import { departments, ruleTemplates } from "@/lib/types";
import type {
  ClaimType,
  Department,
  IncentiveRule,
  IncentiveType,
  PayoutType,
  RuleCategory,
  RuleStatus,
  RuleTemplate
} from "@/lib/types";

const claimTypes: ClaimType[] = ["Employee Claim", "Automatic Trigger", "Manager Verified", "Simulation Only"];
const incentiveTypes: IncentiveType[] = ["Bonus", "Salary Increment", "Formula", "Threshold", "Review", "Custom"];
const payoutTypes: PayoutType[] = ["fixed", "percentage", "milestone", "billing", "split", "not-specified"];
const fallbackCategories: RuleCategory[] = [
  "Acquisition",
  "Referral",
  "Salary Increment",
  "Accuracy",
  "Completion",
  "Retention",
  "Cleanup",
  "Tax Filing",
  "Billing Collection",
  "Marketing Views",
  "Marketing Milestone",
  "Exam",
  "Threshold",
  "Custom"
];

type DrawerMode = "add" | "view" | "edit";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{children}</label>;
}

function TextInput({
  label,
  value,
  onChange,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} />
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value as T)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-teal"
      />
      {label}
    </label>
  );
}

function RuleDrawer({
  mode,
  rule,
  onClose,
  onSave
}: {
  mode: DrawerMode;
  rule: IncentiveRule;
  onClose: () => void;
  onSave: (rule: IncentiveRule) => void;
}) {
  const readOnly = mode === "view";
  const [draft, setDraft] = useState(rule);
  const [template, setTemplate] = useState<RuleTemplate>("Custom Rule");
  const [formulaText, setFormulaText] = useState(JSON.stringify(rule.formulaVariables ?? {}, null, 2));
  const [formulaError, setFormulaError] = useState("");

  const validation = validateIncentiveRule(draft);

  function update<K extends keyof IncentiveRule>(key: K, value: IncentiveRule[K]) {
    setDraft((current) => ({ ...current, [key]: value, updatedAt: new Date().toISOString() }));
  }

  function handleTemplateChange(nextTemplate: RuleTemplate) {
    setTemplate(nextTemplate);
    if (mode !== "add") return;
    const nextRule = makeRuleFromTemplate(nextTemplate);
    setDraft(nextRule);
    setFormulaText(JSON.stringify(nextRule.formulaVariables ?? {}, null, 2));
  }

  function handleSave() {
    try {
      const formulaVariables = formulaText.trim() ? JSON.parse(formulaText) : {};
      onSave({ ...draft, formulaVariables, updatedAt: new Date().toISOString() });
    } catch {
      setFormulaError("Formula variables must be valid JSON.");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="drawer">
        <div className="sticky top-0 z-10 border-b border-line bg-white px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">
                {mode === "add" ? "Add Incentive Rule" : mode === "edit" ? "Edit Incentive Rule" : "View Incentive Rule"}
              </p>
              <h2 className="mt-1 text-2xl font-black text-ink">{draft.ruleName || "Incentive Rule"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {!readOnly && (
                <button className="btn btn-primary" type="button" onClick={handleSave}>
                  Save Rule
                </button>
              )}
              <button className="btn btn-ghost" type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {mode === "add" && (
            <section className="compact-panel p-4">
              <SelectInput label="Rule Template" value={template} options={ruleTemplates} onChange={handleTemplateChange} />
            </section>
          )}

          <section className="compact-panel p-4">
            <h3 className="text-base font-black text-ink">Basic Details</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <TextInput label="Rule Name" value={draft.ruleName} onChange={(value) => update("ruleName", value)} readOnly={readOnly} />
              <SelectInput
                label="Department"
                value={draft.department}
                options={departments}
                onChange={(value: Department) => update("department", value)}
                disabled={readOnly}
              />
              <SelectInput
                label="Rule Category"
                value={draft.ruleCategory}
                options={fallbackCategories}
                onChange={(value: RuleCategory) => update("ruleCategory", value)}
                disabled={readOnly}
              />
              <SelectInput
                label="Claim Type"
                value={draft.claimType}
                options={claimTypes}
                onChange={(value: ClaimType) => update("claimType", value)}
                disabled={readOnly}
              />
              <SelectInput
                label="Incentive Type"
                value={draft.incentiveType}
                options={incentiveTypes}
                onChange={(value: IncentiveType) => update("incentiveType", value)}
                disabled={readOnly}
              />
              <SelectInput
                label="Status"
                value={draft.status}
                options={["Active", "Inactive", "Draft", "Archived"]}
                onChange={(value: RuleStatus) => update("status", value)}
                disabled={readOnly}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              <FieldLabel>Description</FieldLabel>
              <textarea
                className="input min-h-24"
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                readOnly={readOnly}
              />
            </div>
          </section>

          <section className="compact-panel p-4">
            <h3 className="text-base font-black text-ink">Trigger Conditions</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <TextInput
                label="Trigger"
                value={draft.triggerMetric ?? ""}
                onChange={(value) => update("triggerMetric", value)}
                readOnly={readOnly}
              />
              <TextInput
                label="Threshold"
                value={draft.triggerThresholdValue?.toString() ?? ""}
                onChange={(value) => update("triggerThresholdValue", value === "" ? null : Number(value))}
                readOnly={readOnly}
              />
              <TextInput
                label="Metric Unit"
                value={draft.triggerThresholdUnit ?? ""}
                onChange={(value) => update("triggerThresholdUnit", value)}
                readOnly={readOnly}
              />
              <TextInput
                label="Frequency"
                value={draft.triggerFrequency ?? ""}
                onChange={(value) => update("triggerFrequency", value)}
                readOnly={readOnly}
              />
            </div>
          </section>

          <section className="compact-panel p-4">
            <h3 className="text-base font-black text-ink">Payout / Formula</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectInput
                label="Payout Type"
                value={draft.payoutType}
                options={payoutTypes}
                onChange={(value: PayoutType) => update("payoutType", value)}
                disabled={readOnly}
              />
              <TextInput
                label="Amount"
                value={draft.amount?.toString() ?? ""}
                onChange={(value) => update("amount", value === "" ? null : Number(value))}
                readOnly={readOnly}
              />
              <SelectInput
                label="Currency"
                value={draft.currency ?? "KSH"}
                options={["KSH", "USD"]}
                onChange={(value) => update("currency", value)}
                disabled={readOnly}
              />
              <TextInput
                label="Percentage Rate"
                value={draft.percentageRate?.toString() ?? ""}
                onChange={(value) => update("percentageRate", value === "" ? null : Number(value))}
                readOnly={readOnly}
              />
              <TextInput
                label="Max Payout Amount"
                value={draft.maxPayoutAmount?.toString() ?? ""}
                onChange={(value) => update("maxPayoutAmount", value === "" ? null : Number(value))}
                readOnly={readOnly}
              />
              <SelectInput
                label="Max Payout Currency"
                value={draft.maxPayoutCurrency ?? "KSH"}
                options={["KSH", "USD"]}
                onChange={(value) => update("maxPayoutCurrency", value)}
                disabled={readOnly}
              />
              <TextInput
                label="Payout Frequency"
                value={draft.payoutFrequency ?? ""}
                onChange={(value) => update("payoutFrequency", value)}
                readOnly={readOnly}
              />
              <TextInput
                label="Formula Key"
                value={draft.formulaKey ?? ""}
                onChange={(value) => update("formulaKey", value)}
                readOnly={readOnly}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              <FieldLabel>Formula Variables</FieldLabel>
              <textarea
                className="input min-h-28 font-mono text-sm"
                value={formulaText}
                onChange={(event) => {
                  setFormulaText(event.target.value);
                  setFormulaError("");
                }}
                readOnly={readOnly}
              />
              {formulaError && <p className="text-sm font-bold text-red-700">{formulaError}</p>}
            </div>
          </section>

          <section className="compact-panel p-4">
            <h3 className="text-base font-black text-ink">Eligibility / Requirements</h3>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <CheckboxField label="Requires Approval" checked={Boolean(draft.requiresApproval)} onChange={(value) => update("requiresApproval", value)} disabled={readOnly} />
              <CheckboxField label="Requires Evidence" checked={Boolean(draft.requiresEvidence)} onChange={(value) => update("requiresEvidence", value)} disabled={readOnly} />
              <CheckboxField label="Requires Payment Received" checked={Boolean(draft.requiresPaymentReceived)} onChange={(value) => update("requiresPaymentReceived", value)} disabled={readOnly} />
              <CheckboxField label="Requires EF Accepted" checked={Boolean(draft.requiresEfAccepted)} onChange={(value) => update("requiresEfAccepted", value)} disabled={readOnly} />
              <CheckboxField label="Requires Preapproval" checked={Boolean(draft.requiresPreapproval)} onChange={(value) => update("requiresPreapproval", value)} disabled={readOnly} />
              <CheckboxField label="Team Leader Verified" checked={Boolean(draft.requiresTeamLeaderVerification)} onChange={(value) => update("requiresTeamLeaderVerification", value)} disabled={readOnly} />
              <CheckboxField label="Active Client Required" checked={Boolean(draft.requiresActiveClient)} onChange={(value) => update("requiresActiveClient", value)} disabled={readOnly} />
              <CheckboxField label="Paying Client Required" checked={Boolean(draft.requiresPayingClient)} onChange={(value) => update("requiresPayingClient", value)} disabled={readOnly} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="compact-panel p-4">
              <h3 className="text-base font-black text-ink">Advanced</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextInput label="Platform" value={draft.platform ?? ""} onChange={(value) => update("platform", value)} readOnly={readOnly} />
                <TextInput label="Service Type" value={draft.serviceType ?? ""} onChange={(value) => update("serviceType", value)} readOnly={readOnly} />
                <TextInput label="Level Name" value={draft.levelName ?? ""} onChange={(value) => update("levelName", value)} readOnly={readOnly} />
                <TextInput label="Support Type" value={draft.supportType ?? ""} onChange={(value) => update("supportType", value)} readOnly={readOnly} />
              </div>
            </div>
            <div className="compact-panel p-4">
              <h3 className="text-base font-black text-ink">Preview</h3>
              <p className="mt-3 rounded-xl border border-line bg-sage-soft p-3 text-sm font-semibold leading-6 text-slate-700">
                {createRulePreview(draft)}
              </p>
              <div className="mt-3 space-y-1">
                {validation.errors.map((error) => (
                  <p className="text-sm font-bold text-red-700" key={error}>{error}</p>
                ))}
                {validation.warnings.map((warning) => (
                  <p className="text-sm font-bold text-amber-700" key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SetIncentivesClient({ initialRules }: { initialRules: IncentiveRule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<Department | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | "All">("All");
  const [statusFilter, setStatusFilter] = useState<RuleStatus | "All">("All");
  const [drawer, setDrawer] = useState<{ mode: DrawerMode; rule: IncentiveRule } | null>(null);

  const categoryOptions = useMemo(() => getRuleCategories(rules), [rules]);
  const statusOptions = useMemo(() => getRuleStatuses(rules), [rules]);

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        [rule.ruleName, rule.description, rule.department, rule.ruleCategory, rule.triggerMetric, summarizePayout(rule)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesDepartment = departmentFilter === "All" || rule.department === departmentFilter;
      const matchesCategory = categoryFilter === "All" || rule.ruleCategory === categoryFilter;
      const matchesStatus = statusFilter === "All" || rule.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesCategory && matchesStatus;
    });
  }, [rules, search, departmentFilter, categoryFilter, statusFilter]);

  function saveRule(rule: IncentiveRule) {
    setRules((current) => {
      const exists = current.some((item) => item.id === rule.id);
      return exists ? current.map((item) => (item.id === rule.id ? rule : item)) : [rule, ...current];
    });
    setDrawer(null);
  }

  function duplicateRule(rule: IncentiveRule) {
    const duplicated: IncentiveRule = {
      ...rule,
      id: `${rule.id}-copy-${Date.now()}`,
      ruleKey: `${rule.ruleKey}-copy-${Date.now()}`,
      ruleName: `${rule.ruleName} Copy`,
      status: "Draft",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRules((current) => [duplicated, ...current]);
    setDrawer({ mode: "edit", rule: duplicated });
  }

  function toggleActive(rule: IncentiveRule) {
    setRules((current) =>
      current.map((item) =>
        item.id === rule.id
          ? {
              ...item,
              isActive: !item.isActive,
              status: item.isActive ? "Inactive" : "Active",
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal">Rule Engine Foundation</p>
            <h2 className="mt-1 text-3xl font-black text-ink">Set Incentives</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              Create and manage incentive rules, thresholds, payout amounts, salary increments, and automatic trigger
              conditions.
            </p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setDrawer({ mode: "add", rule: makeRuleFromTemplate("Custom Rule") })}>
            Add Incentive Rule
          </button>
        </div>
      </section>

      <section className="compact-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_180px]">
          <div className="space-y-1.5">
            <FieldLabel>Search rules</FieldLabel>
            <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rule name, trigger, payout, or department" />
          </div>
          <SelectInput label="Department filter" value={departmentFilter} options={["All", ...departments]} onChange={setDepartmentFilter} />
          <SelectInput label="Rule Category filter" value={categoryFilter} options={["All", ...categoryOptions]} onChange={setCategoryFilter} />
          <SelectInput label="Status filter" value={statusFilter} options={["All", ...statusOptions]} onChange={setStatusFilter} />
        </div>
      </section>

      <section className="panel p-0">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Department</th>
                <th>Trigger Summary</th>
                <th>Payout Summary</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Effective Date</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <div className="font-black text-ink">{rule.ruleName}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{rule.ruleKey}</div>
                  </td>
                  <td><span className="badge">{rule.department}</span></td>
                  <td>{summarizeTrigger(rule)}</td>
                  <td><strong className="text-dark-teal">{summarizePayout(rule)}</strong></td>
                  <td>{rule.payoutFrequency || rule.triggerFrequency || "Configured by rule"}</td>
                  <td>
                    <span className={rule.status === "Active" ? "badge" : "badge bg-white text-slate-600"}>{rule.status}</span>
                  </td>
                  <td>{rule.effectiveDate}</td>
                  <td>{rule.createdByName}</td>
                  <td>
                    <div className="flex min-w-72 flex-wrap gap-2">
                      <button className="btn btn-ghost px-3 py-2 text-xs" type="button" onClick={() => setDrawer({ mode: "view", rule })}>View</button>
                      <button className="btn btn-secondary px-3 py-2 text-xs" type="button" onClick={() => setDrawer({ mode: "edit", rule })}>Edit</button>
                      <button className="btn btn-ghost px-3 py-2 text-xs" type="button" onClick={() => duplicateRule(rule)}>Duplicate</button>
                      <button className="btn btn-ghost px-3 py-2 text-xs" type="button" onClick={() => toggleActive(rule)}>
                        {rule.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRules.length === 0 && (
          <div className="p-6 text-center text-sm font-bold text-slate-600">No incentive rules match the current filters.</div>
        )}
      </section>

      {drawer && (
        <RuleDrawer mode={drawer.mode} rule={drawer.rule} onClose={() => setDrawer(null)} onSave={saveRule} />
      )}
    </div>
  );
}
