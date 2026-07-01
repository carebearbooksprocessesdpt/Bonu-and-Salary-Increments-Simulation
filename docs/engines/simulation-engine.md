# Simulation Engine

## Purpose

This document defines how the Incentive Simulation should assemble inputs, configured rules, assumptions, planner items, formulas, statuses, charts, and saved scenarios into one deterministic simulation result.

## What Belongs Here

- Simulation run sequence.
- Input normalization and validation.
- Planner rule exposure orchestration.
- Qualifying assumption orchestration.
- Period conversion behavior.
- Scenario save/load behavior.
- Advanced projection orchestration.

Formula definitions belong in [Financial Formulas](../finance/financial-formulas.md). Rule interpretation belongs in [Incentive Engine](incentive-engine.md).

## Simulation Role

The Incentive Simulation is a financial testing tool. It should answer affordability, cost, sustainability, department exposure, incentive-type exposure, safe increment, and break-even questions without modifying real operational records.

It must not:

- Create real claims.
- Approve claims.
- Update employee balances.
- Update actual salary payouts.
- Trigger real salary increments.
- Change approved claim totals.

## Simulation Inputs

The simulation should collect only the numbers needed to run the model clearly:

- Revenue
- Direct Costs
- Salary Payouts
- Profit to Protect
- Exchange Rate
- Currency Display
- Simulation Period
- Close Buffer

Use "Salary Payouts," not "Payroll," on the simulation page.

## Simulation Run Sequence

1. Collect company financial inputs.
2. Determine whether currency conversion is required.
3. Convert all internal values to KSh.
4. Collect planner rules.
5. Collect selected active Set Incentives rules and qualifying assumptions.
6. Calculate planner exposure.
7. Calculate qualifying assumption exposure through the Incentive Engine.
8. Apply period conversion.
9. Split exposure into Bonus Exposure and Salary Increment Exposure.
10. Calculate Total Incentive Exposure.
11. Calculate profit, equilibrium, additional revenue, surplus, safe payout, ratios, safe monthly increment, and break-even values.
12. Determine financial status.
13. Determine sustainability status if configured.
14. Determine projection status if advanced projections are enabled.
15. Render dashboard charts and result cards.

## Exposure Sources

The model calculates incentive exposure from:

- Source A: Planner Rules.
- Source B: Qualifying Employee Assumptions from active Set Incentives rules.

The active payout used by the simulation is:

```text
Total Incentive Exposure KSh =
Planner Exposure KSh + Qualifying Assumption Exposure KSh
```

## Period Conversion

The simulation must respect Monthly, Quarterly, and Annual periods. The detailed conversion formulas are owned by [Financial Formulas](../finance/financial-formulas.md#period-conversion).

Important behavior:

- Monthly / permanent salary increments are multiplied for quarterly and annual simulations.
- Quarterly rules are divided for monthly simulations and multiplied for annual simulations.
- One-time rules should not be multiplied unless the user specifically adds quantity or event count.

## Status Outputs

The simulation should expose:

- Financial Status
- Sustainability Status
- Projection Status

Financial status values:

- Safe
- Close
- Risky
- Needs Exchange Rate
- Needs More Numbers

Sustainability and projection thresholds should be configurable in Set Incentives or simulation settings. Do not hardcode permanent thresholds.

## Scenario Save / Load

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

If a saved scenario used a rule that was later edited, store both:

- `rule_id`
- rule snapshot at time of save

This prevents old scenarios from changing unexpectedly.

## Advanced Projection

The 12-month / 24-month projection should be an advanced optional section, not part of the crowded main dashboard.

It compares revenue growth against compensation growth and finds the first month where:

```text
Compensation(month) >= Revenue(month)
```

If no crossing occurs:

```text
No sustainability breach within projection period
```

## Current Implementation Anchors

| Area | File |
| --- | --- |
| Formula helpers | `../../src/lib/simulation-formulas.ts` |
| Scenario abstraction | `../../src/lib/scenarios.ts` |
| Domain types | `../../src/lib/types.ts` |
| Simulation UI | `../../src/components/SimulationClient.tsx` |

## AI Assistant Notes

When implementing simulation behavior, preserve deterministic calculation order. Do not let UI labels, chart display choices, or scenario persistence change formula semantics.
