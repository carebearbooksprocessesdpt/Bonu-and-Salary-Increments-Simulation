# Database Design

## Purpose

This document defines persistence responsibilities for a production-grade version of the simulator. It does not lock the project into a specific database engine or final schema.

## What Belongs Here

- Conceptual records required by the business requirements.
- Scenario snapshot requirements.
- Rule snapshot behavior.
- Audit fields.
- Persistence ownership boundaries.
- Future schema decisions once implementation begins.

Formula definitions belong in [Financial Formulas](../finance/financial-formulas.md). API contracts belong in [API Design](../api/api-design.md).

## Persistence Principles

- Set Incentives should store configurable incentive rules and all rule values.
- Saved simulation scenarios should restore exactly as saved.
- Historical scenarios must not change when a Set Incentives rule is edited later.
- Do not make browser-only storage the production source of truth.

## Conceptual Records

These records are derived from the requirements and current TypeScript domain model. Physical table names and exact database schema are implementation decisions.

| Record | Purpose |
| --- | --- |
| Incentive Rule | Stores a configured Set Incentives rule, including amounts, thresholds, percentages, trigger logic, evidence requirements, approval requirements, messages, and formula variables. |
| Planner Rule | Stores manually added planning exposure items used only for simulation. |
| Selected Incentive Assumption | Stores the selected rule, qualifying count, base amount, metric value, collection percentage, estimated exposure, and warnings for a simulation. |
| Rule Snapshot | Stores the rule state at the time a scenario is saved. |
| Simulation Scenario | Stores the full set of inputs, assumptions, snapshots, result values, status, creator, and timestamp. |
| Simulation Result Snapshot | Stores calculated exposure, profit, equilibrium, ratios, status, and breakdown values at save time. |

## Scenario Save Fields

When saving a simulation scenario, store:

- Revenue
- Direct Costs
- Salary Payouts
- Profit to Protect
- Exchange Rate
- Currency Display
- Simulation Period
- Close Buffer
- Target Sustainability Ratio
- Planner Rules
- Selected Set Incentives rules
- Qualifying counts
- Base amounts for percentage rules
- Metric values for milestone rules
- Bonus exposure
- Salary increment exposure
- Department breakdown
- Scenario status
- Created by
- Created at

When loaded, restore everything exactly.

## Rule Snapshot Requirement

If a saved scenario used a rule that was later edited, store both:

- `rule_id`
- rule snapshot at time of save

This prevents old scenarios from changing unexpectedly.

## Current Implementation Anchors

| Area | File |
| --- | --- |
| Domain records | `../../src/lib/types.ts` |
| Scenario abstraction | `../../src/lib/scenarios.ts` |
| Seeded rules | `../../src/lib/seed-rules.ts` |

## Open Persistence Decisions

These are architecture decisions for future implementation, not business rules:

- Production database engine.
- Authentication and authorization model.
- Scenario sharing permissions.
- Versioning strategy for Set Incentives rules.
- Audit trail storage.
- Migration strategy from the current in-memory scenario abstraction.

## AI Assistant Notes

Do not invent columns, constraints, or database behavior that changes business logic. If schema work is requested, trace each persisted field back to this document, the TypeScript domain types, or an explicit user requirement.
