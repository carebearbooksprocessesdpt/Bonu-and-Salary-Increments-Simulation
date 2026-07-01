# CareBearBooks Documentation Index

This folder is the navigation layer for the CareBearBooks Bonus and Salary Increments Simulation project. It separates business requirements, formulas, engines, data design, API design, UI specifications, workflow, roadmap, and source-rule references so developers and AI coding assistants can find the right contract before changing code.

## Documentation Rules

- Do not invent business rules.
- Do not modify formulas unless the approved source documentation changes first.
- Do not hardcode incentive payout values in calculation logic.
- Set Incentives is the source of truth for rule values, thresholds, percentages, trigger counts, messages, evidence requirements, approval requirements, and formula variables.
- The Incentive Simulation is a financial testing tool. It must not create claims, approve claims, update balances, update salary payouts, or trigger real salary increments.
- All internal financial math runs in KSh.

## Recommended Reading Paths

### New Developer Or AI Assistant

1. [Business Requirements](business/business-requirements.md)
2. [Architecture Overview](architecture/architecture-overview.md)
3. [Financial Formulas](finance/financial-formulas.md)
4. [Simulation Engine](engines/simulation-engine.md)
5. [Incentive Engine](engines/incentive-engine.md)

### Formula Or Calculation Work

1. [Financial Formulas](finance/financial-formulas.md)
2. [Simulation Engine](engines/simulation-engine.md)
3. [Incentive Engine](engines/incentive-engine.md)
4. Implementation anchor: `../src/lib/simulation-formulas.ts`

### Set Incentives Or Rule Configuration Work

1. [Incentive Engine](engines/incentive-engine.md)
2. [Set Incentives Rule Values](reference/set-incentives-rule-values.md)
3. [Database Design](data/database-design.md)
4. Implementation anchors: `../src/lib/incentive-rules.ts`, `../src/lib/seed-rules.ts`, `../src/lib/types.ts`

### Scenario Save, Load, Or Persistence Work

1. [Database Design](data/database-design.md)
2. [Simulation Engine](engines/simulation-engine.md)
3. [API Design](api/api-design.md)
4. Implementation anchor: `../src/lib/scenarios.ts`

### Dashboard Or Product UI Work

1. [UI/UX Specifications](product/ui-ux-specifications.md)
2. [Business Requirements](business/business-requirements.md)
3. [Financial Formulas](finance/financial-formulas.md)
4. Implementation anchors: `../src/components/SimulationClient.tsx`, `../src/components/SetIncentivesClient.tsx`

## Document Map

| Document | Purpose | What Belongs There |
| --- | --- | --- |
| [Business Requirements](business/business-requirements.md) | Defines what the simulator must answer and what it must not do. | Business questions, required inputs, business statuses, scope boundaries, non-goals. |
| [Architecture Overview](architecture/architecture-overview.md) | Defines the production system boundaries and source-of-truth model. | Component boundaries, data flow, ownership rules, implementation anchors, cross-document contracts. |
| [Financial Formulas](finance/financial-formulas.md) | Preserves calculation contracts. | Currency conversion, exposure formulas, affordability formulas, ratios, break-even days, projections, status logic. |
| [Simulation Engine](engines/simulation-engine.md) | Defines how a simulation run is assembled and evaluated. | Input normalization, exposure source orchestration, period conversion, statuses, scenario save/load behavior. |
| [Incentive Engine](engines/incentive-engine.md) | Defines how configured Set Incentives rules are interpreted. | Rule source-of-truth rules, payout types, formula-variable usage, bonus vs salary increment handling. |
| [Database Design](data/database-design.md) | Defines persistence responsibilities without locking the project into a premature schema. | Conceptual records, scenario snapshot requirements, rule snapshot behavior, audit fields, future persistence notes. |
| [API Design](api/api-design.md) | Defines API boundaries and rules for future endpoint contracts. | Currency route, future rule/scenario/simulation APIs, external integration exclusions, request/response documentation standards. |
| [UI/UX Specifications](product/ui-ux-specifications.md) | Defines the dashboard experience. | Page layout, charts, result cards, advanced projections, labels, status display behavior. |
| [Development Workflow](development/development-workflow.md) | Defines how humans and AI assistants should safely modify the project. | Reading order, change protocol, testing expectations, local commands, documentation update rules. |
| [Roadmap](product/roadmap.md) | Tracks project evolution without changing business rules. | Current foundation, planned implementation areas, optional advanced sections, future prompts. |
| [Set Incentives Rule Values](reference/set-incentives-rule-values.md) | Preserves the current configured rule values from the handoff. | Rule values to seed/configure in Set Incentives, not hardcode in calculation logic. |
| [Source Handoff Map](reference/source-handoff-map.md) | Maps the original combined document sections to the split docs. | Traceability from the original numbered sections to their new homes. |

## Implementation Anchors

| Area | Current Files |
| --- | --- |
| Formula helpers | `../src/lib/simulation-formulas.ts` |
| Currency helpers | `../src/lib/currency.ts` |
| Domain types | `../src/lib/types.ts` |
| Rule helpers | `../src/lib/incentive-rules.ts` |
| Seeded Set Incentives rules | `../src/lib/seed-rules.ts` |
| Scenario abstraction | `../src/lib/scenarios.ts` |
| Simulation UI | `../src/components/SimulationClient.tsx` |
| Set Incentives UI | `../src/components/SetIncentivesClient.tsx` |
| Currency API route | `../src/app/api/currency/usd-ksh/route.ts` |

## Change Protocol

Before changing code, identify the governing document. If a requested change affects formulas, update or confirm [Financial Formulas](finance/financial-formulas.md) first. If a requested change affects payout values, thresholds, percentages, trigger rules, or formula variables, update or confirm [Set Incentives Rule Values](reference/set-incentives-rule-values.md) and the Set Incentives data model first.

If documentation and code disagree, treat the documentation as the business contract and investigate the mismatch before editing calculation behavior.
