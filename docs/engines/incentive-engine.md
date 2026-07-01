# Incentive Engine

## Purpose

This document defines how Set Incentives rules should be interpreted by the simulation. It keeps rule configuration separate from formula execution so payout values do not become hidden constants in code.

## What Belongs Here

- Set Incentives source-of-truth rules.
- Rule selection behavior.
- Payout type interpretation.
- Formula variable usage.
- Bonus vs salary increment classification.
- Relationship between claims, approvals, and simulation assumptions.

Configured values belong in [Set Incentives Rule Values](../reference/set-incentives-rule-values.md). Financial equations belong in [Financial Formulas](../finance/financial-formulas.md).

## Core Principle

The simulation must not use hidden hardcoded incentive numbers.

The model should work like this:

- Set Incentives = source of truth for incentive rules, amounts, thresholds, percentages, and trigger logic.
- Incentive Simulation = financial testing tool that uses those rules.
- Claims = real submitted work.
- Approvals = confirm whether claims actually count.

Formula values must come from Set Incentives.

Example:

```text
Formula:
viewBlocks = Math.floor(views / viewThreshold)

Values from Set Incentives:
viewThreshold = 500
faceReward = KSh 1,000
editorReward = KSh 500
```

Sales example:

```text
Formula:
completedMilestones = Math.floor(countedClients / milestoneClientCount)

Values from Set Incentives:
milestoneClientCount = 10
milestoneIncrementAmount = KSh 5,000
```

All payout amounts, salary increment amounts, trigger counts, thresholds, percentages, billing thresholds, time periods, messages, evidence requirements, approval requirements, and formula variables should become configurable in Set Incentives.

## Qualifying Assumption Flow

```text
Select Incentive Rule
Enter how many employees / clients / claims / views qualify
Simulation calculates exposure
```

Selected rules should come from active rules in Set Incentives.

## Payout Types

The incentive engine must support:

- Fixed amount rules.
- Percentage rules.
- Milestone block rules.
- Salary increment rules.
- Billing collection rules.
- Rules that count toward a threshold without direct payout.

The formulas for these payout types are documented in [Financial Formulas](../finance/financial-formulas.md#payout-per-rule).

## Bonus Vs Salary Increment Classification

This distinction is critical.

Bonuses are usually one-time or period-based and represent temporary incentive exposure.

Examples:

- Sales acquisition bonus
- Payroll onboarding bonus
- Bookkeeping cleanup bonus
- Tax additional reward
- Marketing view reward
- Referral bonus

Salary increments are permanent monthly increases and represent recurring monthly cost.

Examples:

- General department Meet increment
- Sales 10-client milestone
- EA exam increments
- Marketing subscriber/follower increments

Rule:

```text
Bonuses reset.
Salary increments continue.
```

The simulation should separate:

- Bonus Exposure
- Salary Increment Exposure
- Total Incentive Exposure

## Departments

Department exposure should group by:

- Sales
- Payroll
- Bookkeeping
- Processes
- Taxes
- Billing
- Marketing
- EA / Tax Professional
- Admin / Management
- Other

Only departments with exposure above zero should be shown in the department breakdown.

## Rule Values

Current configured rule values from the handoff are preserved in [Set Incentives Rule Values](../reference/set-incentives-rule-values.md).

Those values should be seeded or configured in Set Incentives, not hardcoded in calculation logic.

## Current Implementation Anchors

| Area | File |
| --- | --- |
| Rule types | `../../src/lib/types.ts` |
| Rule helpers | `../../src/lib/incentive-rules.ts` |
| Seeded rules | `../../src/lib/seed-rules.ts` |
| Formula helpers | `../../src/lib/simulation-formulas.ts` |
| Set Incentives UI | `../../src/components/SetIncentivesClient.tsx` |

## AI Assistant Notes

When adding a new rule type, first document which values are configurable in Set Incentives. Calculation code may define the formula shape, but not bury the business values inside helper functions.
