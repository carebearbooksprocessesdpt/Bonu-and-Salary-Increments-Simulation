# Business Requirements

## Purpose

This document defines the business questions, required inputs, statuses, and scope boundaries for the CareBearBooks Incentive Simulation. It should be readable by product owners, developers, and AI coding assistants before any implementation work begins.

## What Belongs Here

- Business questions the simulator must answer.
- Required business inputs and their meanings.
- Business-facing status meanings.
- Scope boundaries and non-goals.
- Terminology that affects user-facing behavior.

Formula details belong in [Financial Formulas](../finance/financial-formulas.md). Engine orchestration belongs in [Simulation Engine](../engines/simulation-engine.md). Configured incentive values belong in [Set Incentives Rule Values](../reference/set-incentives-rule-values.md).

## Main Business Questions

The Incentive Simulation should answer:

- Can the company afford the selected incentive plan?
- How much will the incentives cost if certain employees qualify?
- Will profit after incentives stay above the protected profit amount?
- How much additional revenue is needed if the plan is not affordable?
- Which department or incentive type is creating the biggest cost?
- Are bonuses or permanent salary increments creating more risk?
- How much monthly salary increment can the company safely afford?
- How long does a client-related bonus take to pay for itself?
- Will the plan still be sustainable over time if salary increments keep stacking?

The model should not just say "Safe" or "Risky." It should explain why.

## Core Business Principle

The simulation must not use hidden hardcoded incentive numbers.

- Set Incentives is the source of truth for incentive rules, amounts, thresholds, percentages, trigger logic, billing thresholds, time periods, messages, evidence requirements, approval requirements, and formula variables.
- Incentive Simulation is the financial testing tool that uses those rules.
- Claims are real submitted work.
- Approvals confirm whether claims actually count.

The formulas can remain in code, but the values inside the formulas must come from Set Incentives.

## Required Company Financial Inputs

| Input | Meaning |
| --- | --- |
| Revenue | Total company revenue for the selected period. |
| Direct Costs | Cost of services / non-salary operating costs. |
| Salary Payouts | Total salary expense before incentives. |
| Profit to Protect | Minimum profit the company must keep after incentives. |
| Exchange Rate | KSh per 1 USD. |
| Currency Display | All USD or All KSh. |
| Simulation Period | Monthly, Quarterly, or Annual. |
| Close Buffer | Amount or percentage above protected profit used to trigger "Close" warning. |

Use "Salary Payouts," not "Payroll," on the simulation page.

## Business Statuses

### Financial Status

| Status | Meaning |
| --- | --- |
| Safe | Revenue is clearly above equilibrium. |
| Close | Profit is protected, but the buffer is small. |
| Risky | Profit after incentives falls below protected profit. |
| Needs Exchange Rate | Conversion cannot run. |
| Needs More Numbers | Required inputs are missing. |

### Sustainability Status

Sustainability status comes from the ratio model. Example labels can include:

- Healthy: Sustainability Ratio below target.
- Watch: Sustainability Ratio close to target.
- High Risk: Sustainability Ratio above target.

Do not hardcode permanent thresholds. Store target ratio and warning thresholds in Set Incentives or simulation settings.

### Projection Status

For advanced projection:

- No breach within projection period.
- Watch: breach after 12 months.
- Risky: breach within 12 months.
- Critical: breach within 3 months.

## Scope Boundaries

The simulator should not:

- Create real claims.
- Approve claims.
- Update employee balances.
- Update actual salary payouts.
- Trigger real salary increments.
- Change approved claim totals.
- Use fake data.
- Use hardcoded incentive payouts.
- Use QuickBooks API.
- Use Canopy API.
- Use OpenAI API.
- Use Meets/Exceeds/Outstanding tiers.

The latest accepted app rule is Meet only, and Exceeding/Outstanding were removed.

## AI Assistant Notes

When implementing business-facing behavior, first identify whether the request changes a business rule, a formula, or only the UI. If it changes a rule value, threshold, payout amount, or trigger, route it through Set Incentives documentation and data rather than embedding it into calculation code.
