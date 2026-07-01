# Financial Formulas

## Purpose

This document preserves the calculation contracts for the CareBearBooks Incentive Simulation. Developers and AI coding assistants should treat these formulas as the authoritative formula reference unless the business owner updates the requirements.

## What Belongs Here

- Currency conversion formulas.
- Incentive exposure formulas.
- Period conversion formulas.
- Profit, equilibrium, affordability, and status formulas.
- Sustainability ratios.
- Maximum sustainable monthly increment formulas.
- Break-even formulas.
- Projection formulas.

Configured rule values belong in [Set Incentives Rule Values](../reference/set-incentives-rule-values.md). Engine sequencing belongs in [Simulation Engine](../engines/simulation-engine.md).

## Currency Logic

All internal math should run in KSh.

If the user enters values in USD:

```text
Value_KSh = Value_USD * Exchange Rate
```

If the user enters values in KSh:

```text
Value_KSh = Value entered
```

This applies to:

- Revenue
- Direct Costs
- Salary Payouts
- Profit to Protect
- Close Buffer
- Incentive amounts
- Base amounts for percentage rules

The display can convert back to USD if the user selects All USD:

```text
Value_USD = Value_KSh / Exchange Rate
```

If exchange rate is missing and conversion is needed:

```text
Status = Needs Exchange Rate
```

Never show `NaN`, `Infinity`, `undefined`, or broken values.

## Incentive Exposure Sources

The model calculates incentive exposure from two sources.

### Source A: Planner Rules

Planner rules are manually added planning rules.

```text
Rule Exposure = Employee Count * Amount
```

If rule currency is USD:

```text
Rule Exposure KSh = Rule Exposure * Exchange Rate
```

If rule currency is KSh:

```text
Rule Exposure KSh = Rule Exposure
```

Then:

```text
Planner Exposure KSh = SUM(all planner rule exposures)
```

### Source B: Qualifying Employee Assumptions

Qualifying assumptions come from active rules in Set Incentives.

Flow:

```text
Select Incentive Rule
Enter how many employees / clients / claims / views qualify
Simulation calculates exposure
```

Example:

```text
Selected Rule: Payroll Accuracy Bonus - KSh 2,000 quarterly
Qualifying Employees: 4
Exposure: 4 * KSh 2,000 = KSh 8,000 quarterly
```

## Payout Per Rule

### Fixed Amount Rule

```text
Amount = configured rule amount
```

Example:

```text
Sales independent acquisition = KSh 3,500
```

### Percentage Rule

```text
Amount = Base Amount * Percentage Rate
```

Example:

```text
Tax return main reward = billed amount * 10%
```

### Milestone Block Rule

```text
Blocks = Math.floor(metricValue / threshold)

Payout = Blocks * amount
```

Example:

```text
Views = 1,200
Threshold = 500
Blocks = Math.floor(1200 / 500) = 2

Face payout = 2 * KSh 1,000
Editor payout = 2 * KSh 500
```

### Salary Increment Rule

Salary increments are recurring and permanent.

```text
Exposure = Amount * Qualifying Employees
```

Then apply period conversion.

## Period Conversion

The simulation must respect the selected period: Monthly, Quarterly, or Annual.

### Monthly / Permanent Salary Increment

```text
If Simulation Period = Monthly:
Exposure = Raw Exposure

If Simulation Period = Quarterly:
Exposure = Raw Exposure * 3

If Simulation Period = Annual:
Exposure = Raw Exposure * 12
```

### Quarterly Rule

```text
If Simulation Period = Monthly:
Exposure = Raw Exposure / 3

If Simulation Period = Quarterly:
Exposure = Raw Exposure

If Simulation Period = Annual:
Exposure = Raw Exposure * 4
```

### One-Time Rule

```text
Exposure = Raw Exposure
```

One-time rules should not be multiplied unless the user specifically adds quantity or event count.

## Total Incentive Exposure

```text
Total Incentive Exposure KSh =
Planner Exposure KSh + Qualifying Assumption Exposure KSh
```

This is the active payout used in the simulation.

```text
Active Payout = Total Incentive Exposure KSh
```

## Core Financial Formulas

### Total Outflows Before Incentives

```text
Total Outflows Before Incentives =
Direct Costs + Salary Payouts
```

### Profit Before Incentives

```text
Profit Before Incentives =
Revenue - Direct Costs - Salary Payouts
```

### Profit After Incentives

```text
Profit After Incentives =
Profit Before Incentives - Total Incentive Exposure
```

### Maximum Safe Payout

```text
Maximum Safe Payout =
Profit Before Incentives - Profit to Protect
```

This means Maximum Safe Payout is the maximum incentive amount the company can pay while still protecting profit.

### Equilibrium Revenue

```text
Equilibrium Revenue =
Direct Costs + Salary Payouts + Total Incentive Exposure + Profit to Protect
```

This is the minimum revenue needed to afford the plan.

### Additional Revenue Needed

```text
Additional Revenue Needed =
MAX(0, Equilibrium Revenue - Revenue)
```

### Revenue Surplus

```text
Revenue Surplus =
Revenue - Equilibrium Revenue
```

Positive means the plan is affordable. Negative means the company has a shortfall.

## Financial Status

### Close Buffer

If entered as an amount:

```text
Close Buffer KSh = Close Buffer Amount
```

If entered as a percentage:

```text
If percentage > 1:
Close Buffer KSh = Profit to Protect * (percentage / 100)

If percentage <= 1:
Close Buffer KSh = Profit to Protect * percentage
```

### Status Logic

```text
If exchange rate is needed but missing:
Status = Needs Exchange Rate

Else if core values are missing:
Status = Needs More Numbers

Else if Profit After Incentives < Profit to Protect:
Status = Risky

Else:
Gap = Profit After Incentives - Profit to Protect

If Close Buffer is set AND Gap <= Close Buffer:
Status = Close

Else:
Status = Safe
```

## Sustainability Ratios

### Total Compensation Cost

```text
Total Compensation Cost =
Salary Payouts + Bonus Exposure + Salary Increment Exposure
```

### Base Salary Ratio

```text
Base Salary Ratio =
Salary Payouts / Revenue
```

### Bonus Ratio

```text
Bonus Ratio =
Bonus Exposure / Revenue
```

### Salary Increment Ratio

```text
Salary Increment Ratio =
Salary Increment Exposure / Revenue
```

### Sustainability Ratio

```text
Sustainability Ratio =
Total Compensation Cost / Revenue
```

Or:

```text
Sustainability Ratio =
Base Salary Ratio + Bonus Ratio + Salary Increment Ratio
```

The basic Safe/Close/Risky model tells whether the company can afford the plan. The sustainability ratio tells why the plan is risky.

Bonus costs reset, but salary increments keep accumulating and can become the long-term danger.

## Bonus Vs Salary Increment Treatment

The model must treat bonuses and salary increments differently.

Bonuses are usually one-time or period-based. Bonus equals temporary incentive exposure.

Salary increments are permanent monthly increases. Salary Increment equals recurring monthly cost.

Rule:

```text
Bonuses reset.
Salary increments continue.
```

The simulation should separate:

- Bonus Exposure
- Salary Increment Exposure
- Total Incentive Exposure

## Maximum Sustainable Monthly Increment

This tells the company how much more permanent monthly salary increment can be safely afforded.

### Monthly Simulation

```text
Maximum Sustainable Monthly Increment =
(Revenue * Target Sustainability Ratio)
- Salary Payouts
- Bonus Exposure
```

### Quarterly Simulation

```text
Maximum Sustainable Monthly Increment =
((Quarterly Revenue * Target Sustainability Ratio) - Quarterly Bonus Exposure) / 3
- Monthly Salary Payouts
```

### Annual Simulation

```text
Maximum Sustainable Monthly Increment =
((Annual Revenue * Target Sustainability Ratio) - Annual Bonus Exposure) / 12
- Monthly Salary Payouts
```

### Protected Profit Fallback

If no target ratio is set, use the protected profit method instead:

```text
Maximum Safe Monthly Increment =
Maximum Safe Payout converted to monthly equivalent
```

Example:

```text
Maximum Safe Payout = KSh 120,000 for quarter

Maximum Safe Monthly Increment =
120,000 / 3 = KSh 40,000 per month
```

## Break-Even Days

This applies to client-related incentives.

```text
Break-Even Days =
(Bonus Amount / Monthly Client Revenue) * 30
```

Example:

```text
Bonus Amount = KSh 3,500
Monthly Client Revenue = KSh 13,000

Break-Even Days =
(3,500 / 13,000) * 30

Break-Even Days = 8.08 days
```

This means the client pays back the bonus in about 8 days of revenue.

Applies to:

- Sales acquisition
- Referral bonus
- Payroll onboarding
- Bookkeeping onboarding or retention
- Consultation-assisted onboarding
- Tax-only client acquisition

## Department Breakdown

The pie chart should group exposure by department.

```text
Department Exposure =
SUM(planner rule exposure for department)
+ SUM(qualifying assumption exposure for department)
```

Only departments with exposure above zero should be shown.

Departments include:

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

## Bonus Vs Salary Increment Chart

The bar chart should split total exposure into bonus exposure and salary increment exposure.

```text
Bonus Total =
SUM(all selected incentives where incentive type is Bonus or one-time reward)

Salary Increment Total =
SUM(all selected incentives where isPermanentSalaryIncrement = true)

Total Incentive Exposure =
Bonus Total + Salary Increment Total
```

## Revenue Vs Equilibrium Chart

This chart should show:

- Current Revenue
- Equilibrium Revenue

If revenue is above equilibrium, the plan is affordable. If revenue is below equilibrium, the company needs additional revenue.

## Profit Flow Waterfall Chart

The waterfall should show:

```text
Revenue
- Direct Costs
- Salary Payouts
- Incentives
= Profit After Incentives
```

Alternative display:

```text
Revenue
Costs + Salary Payouts
Incentives
Protected Profit
Remaining Profit / Shortfall
```

## 12-Month / 24-Month Projection

This should be an advanced optional section, not part of the crowded main dashboard.

### Revenue Projection

```text
Revenue(month m) =
Revenue(month m-1) * (1 + Monthly Growth Rate)
```

### Salary Increment Projection

```text
Increment Burden(month m) =
Increment Burden(month m-1) + New Increment Added
```

Since salary increments are permanent:

```text
Increment Burden never decreases
```

### Compensation Projection

```text
Compensation(month m) =
Salary Payouts
+ Existing Increment Burden
+ New Increment Burden
+ Bonus Exposure for that period
```

### Crossing Point

Find the first month where:

```text
Compensation(month) >= Revenue(month)
```

This is the warning month.

If no crossing occurs:

```text
No sustainability breach within projection period
```

## Final Combined Formula Summary

### Main Formula

```text
Revenue
- Direct Costs
- Salary Payouts
= Profit Before Incentives

Profit Before Incentives
- Total Incentive Exposure
= Profit After Incentives
```

### Affordability Test

```text
If Profit After Incentives >= Profit to Protect:
Plan is affordable

If Profit After Incentives < Profit to Protect:
Plan is risky
```

### Equilibrium

```text
Equilibrium Revenue =
Direct Costs + Salary Payouts + Total Incentive Exposure + Profit to Protect
```

### Additional Revenue

```text
Additional Revenue Needed =
MAX(0, Equilibrium Revenue - Revenue)
```

### Sustainability Ratio

```text
Sustainability Ratio =
(Salary Payouts + Bonus Exposure + Salary Increment Exposure) / Revenue
```

### Maximum Safe Payout

```text
Maximum Safe Payout =
Profit Before Incentives - Profit to Protect
```

### Break-Even Days

```text
Break-Even Days =
(Bonus Amount / Monthly Client Revenue) * 30
```

### Salary Increment Projection

Salary increments are permanent and cumulative.

```text
Increment Burden(month) =
Previous Increment Burden + New Permanent Increment
```

## AI Assistant Notes

When editing formula code, keep the formula names and meanings traceable to this document. If a requested implementation change would alter any equation here, pause and confirm the business rule before coding.
