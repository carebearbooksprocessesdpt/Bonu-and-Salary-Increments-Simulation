# Team Task Split

## Purpose

This document divides the CareBearBooks Bonus and Salary Increments Simulation project into four developer lanes. The goal is to let multiple people work in parallel without changing the same files unnecessarily or mixing business rules, formulas, UI layout, and persistence work.

This is planning documentation only. It does not introduce new business rules, change formulas, or authorize application logic changes.

## Repository Areas Reviewed

| Area | Current Files |
| --- | --- |
| App routes | `src/app/` |
| UI components | `src/components/` |
| Formula helpers | `src/lib/simulation-formulas.ts` |
| Currency helpers | `src/lib/currency.ts` |
| Incentive rule helpers | `src/lib/incentive-rules.ts` |
| Seeded incentive rules | `src/lib/seed-rules.ts` |
| Scenario abstraction | `src/lib/scenarios.ts` |
| Shared domain types | `src/lib/types.ts` |
| Documentation | `docs/` |

## Developer 1 - Simulation Calculation Engine

Branch: `feature/simulation-engine`

### Responsible For

- Financial formulas
- Affordability logic
- Equilibrium revenue
- Profit before/after incentives
- Sustainability ratios
- Maximum safe payout
- Break-even calculations

### Allowed Areas

- Calculation/helper files
- Formula-related docs
- Simulation engine docs

Primary files and docs:

- `src/lib/simulation-formulas.ts`
- `src/lib/currency.ts`
- `docs/finance/financial-formulas.md`
- `docs/engines/simulation-engine.md`
- `docs/development/TEAM_TASK_SPLIT.md`, only when coordination rules change

### Avoid

- UI layout files unless coordinated
- Database save/load files unless coordinated
- Incentive rule seed values unless coordinated with Developer 3
- Shared domain type changes unless coordinated with affected lanes

### Coordination Notes

Coordinate with Developer 2 if a formula result changes what the dashboard displays. Coordinate with Developer 4 if saved scenario result snapshots need new calculated fields.

## Developer 2 - UI Dashboard

Branch: `feature/dashboard-ui`

### Responsible For

- Dashboard layout
- Result cards
- Charts
- Form layout
- User experience
- Responsive UI

### Allowed Areas

- `src/components/`
- `src/app/`
- UI documentation

Primary files and docs:

- `src/components/SimulationClient.tsx`
- `src/components/SetIncentivesClient.tsx`, when the UI task touches Set Incentives presentation only
- `src/components/NavLinks.tsx`
- `src/app/`
- `src/app/globals.css`
- `docs/product/ui-ux-specifications.md`

### Avoid

- Core formula logic unless coordinated
- Rule seed values unless coordinated with Developer 3
- Scenario persistence behavior unless coordinated with Developer 4

### Coordination Notes

Coordinate with Developer 1 before changing calculated values, status behavior, chart math, or result-card formulas. Coordinate with Developer 3 before changing Set Incentives rule editing behavior.

## Developer 3 - Incentive Rules / Set Incentives

Branch: `feature/incentive-rules`

### Responsible For

- Set Incentives structure
- Incentive rule types
- Rule configuration
- Bonus vs salary increment classification
- Department and rule metadata

### Allowed Areas

- Incentive rule config files
- Incentive engine docs
- Set Incentives reference docs

Primary files and docs:

- `src/lib/incentive-rules.ts`
- `src/lib/seed-rules.ts`
- `src/lib/types.ts`, only for rule-model changes coordinated with other lanes
- `src/components/SetIncentivesClient.tsx`, only when rule configuration UI changes are coordinated with Developer 2
- `docs/engines/incentive-engine.md`
- `docs/reference/set-incentives-rule-values.md`
- `docs/reference/source-handoff-map.md`, only for traceability updates

### Avoid

- Main dashboard UI unless coordinated
- Core financial formulas unless coordinated
- Scenario persistence behavior unless coordinated with Developer 4

### Coordination Notes

Coordinate with Developer 1 before changing payout type behavior, formula variables, or classification that affects exposure calculations. Coordinate with Developer 4 before changing rule fields that must be preserved in scenario snapshots.

## Developer 4 - Data Models / Scenario Save Load

Branch: `feature/scenario-save-load`

### Responsible For

- Scenario save/load model
- Data structures
- Database design
- Rule snapshot storage
- Saved simulation state

### Allowed Areas

- Data model files
- Scenario persistence files
- Database design docs

Primary files and docs:

- `src/lib/scenarios.ts`
- `src/lib/types.ts`, only for scenario/data-model changes coordinated with other lanes
- `docs/data/database-design.md`
- `docs/api/api-design.md`, when scenario or data endpoints are planned
- `docs/engines/simulation-engine.md`, only for save/load orchestration updates

### Avoid

- UI and formula logic unless coordinated
- Incentive rule value changes unless coordinated with Developer 3
- Dashboard component changes unless coordinated with Developer 2

### Coordination Notes

Coordinate with Developer 1 when result snapshot fields change. Coordinate with Developer 3 when rule snapshots need new rule fields. Coordinate with Developer 2 when save/load actions need UI controls.

## Shared Files That Require Coordination

The following files can affect more than one lane. If two people need one of these files, they must coordinate first:

- `src/lib/types.ts`
- `src/components/SimulationClient.tsx`
- `src/components/SetIncentivesClient.tsx`
- `docs/INDEX.md`
- `docs/engines/simulation-engine.md`
- `docs/development/development-workflow.md`
- `docs/development/TEAM_TASK_SPLIT.md`

## Conflict Prevention Rules

- Nobody works directly on `main`.
- Nobody works directly on `dev`.
- Everyone starts from latest `dev`.
- Everyone creates their own feature branch.
- Every pull request targets `dev`.
- Only the project owner merges `dev` into `main`.
- If two people need the same file, they must coordinate first.
- Each pull request must describe what files were changed and why.

## Pull Request Expectations

Each pull request should include:

- Branch name.
- Developer lane.
- Summary of what changed.
- List of files changed and why.
- Any coordinated files touched.
- Any documentation updated.
- Confirmation that no unrelated business rules or formulas were changed.

## AI Assistant Notes

When assisting a developer, identify the lane first. If the requested change crosses lanes, document the coordination point before editing files.
