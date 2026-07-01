# Development Workflow

## Purpose

This document gives developers and AI coding assistants a safe workflow for changing the project without mixing business rules, formulas, UI behavior, and implementation details.

## What Belongs Here

- Local development commands.
- Safe change process.
- AI assistant reading order.
- Formula and rule change protocol.
- Testing expectations.
- Documentation update rules.

## Local Commands

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## AI Assistant Reading Order

Start at [INDEX](../INDEX.md), then read the specific document that owns the requested work:

- Business behavior: [Business Requirements](../business/business-requirements.md)
- Architecture: [Architecture Overview](../architecture/architecture-overview.md)
- Formulas: [Financial Formulas](../finance/financial-formulas.md)
- Simulation orchestration: [Simulation Engine](../engines/simulation-engine.md)
- Rule interpretation: [Incentive Engine](../engines/incentive-engine.md)
- Persistence: [Database Design](../data/database-design.md)
- API: [API Design](../api/api-design.md)
- UI: [UI/UX Specifications](../product/ui-ux-specifications.md)
- Roadmap: [Roadmap](../product/roadmap.md)

## Change Protocol

1. Identify the owning document before editing code.
2. Confirm whether the requested change affects business rules, formulas, configuration values, UI presentation, persistence, or API boundaries.
3. For formula changes, update or confirm [Financial Formulas](../finance/financial-formulas.md) first.
4. For payout values, thresholds, percentages, trigger logic, evidence requirements, approval requirements, or formula variables, update or confirm Set Incentives data and [Set Incentives Rule Values](../reference/set-incentives-rule-values.md).
5. Keep calculation helpers free of hidden payout constants.
6. Preserve scenario snapshot behavior when changing rule or persistence code.
7. Update relevant docs in the same change when implementation behavior changes.

## Formula Implementation Rules

- All internal math runs in KSh.
- USD values require exchange-rate conversion before calculation.
- Missing exchange rate should produce "Needs Exchange Rate" when conversion is required.
- Missing core values should produce "Needs More Numbers."
- Never surface `NaN`, `Infinity`, `undefined`, or broken values.
- Keep bonuses and salary increments separate.
- Salary increments are recurring and permanent.
- Bonuses reset.

## Testing Expectations

Add or update tests when implementation reaches the relevant area:

- Currency conversion and missing exchange-rate behavior.
- Fixed, percentage, milestone, billing, and salary increment exposure.
- Monthly, quarterly, and annual period conversion.
- Profit before incentives, profit after incentives, equilibrium revenue, additional revenue, surplus, maximum safe payout.
- Safe, Close, Risky, Needs Exchange Rate, and Needs More Numbers status logic.
- Sustainability ratios.
- Maximum safe monthly increment.
- Break-even days.
- Scenario save/load with rule snapshots.
- UI rendering that avoids broken numeric values.

## Documentation Standards

- Put formulas only in [Financial Formulas](../finance/financial-formulas.md).
- Put configured rule values only in [Set Incentives Rule Values](../reference/set-incentives-rule-values.md) or Set Incentives data.
- Put dashboard behavior in [UI/UX Specifications](../product/ui-ux-specifications.md).
- Put persistence decisions in [Database Design](../data/database-design.md).
- Put endpoint contracts in [API Design](../api/api-design.md).
- Use [Source Handoff Map](../reference/source-handoff-map.md) to trace the original combined documentation.

## AI Assistant Notes

If the user's request conflicts with the documentation, do not silently choose a new business rule. Explain the conflict and ask for the missing decision.
