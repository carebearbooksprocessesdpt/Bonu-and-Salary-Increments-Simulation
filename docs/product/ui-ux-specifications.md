# UI/UX Specifications

## Purpose

This document defines the dashboard and interaction requirements for the CareBearBooks Incentive Simulation user experience.

## What Belongs Here

- Page layout.
- Input labels.
- Dashboard sections.
- Chart requirements.
- Result cards.
- Advanced collapsible sections.
- Status display behavior.

Formula details belong in [Financial Formulas](../finance/financial-formulas.md). Business scope belongs in [Business Requirements](../business/business-requirements.md).

## Design Direction

Keep the dashboard compact. The simulator should explain affordability, exposure, sustainability, and risk without crowding the main view.

Use "Salary Payouts," not "Payroll," on the simulation page.

## Top Row

The top row should include:

- Revenue
- Direct Costs
- Salary Payouts
- Profit to Protect
- Currency Display
- Exchange Rate
- Simulation Period

## Incentive Qualifying Employees Section

This section should support:

- Select Incentive
- Enter qualifying employees / claims / clients / views
- Add to Simulation

## Charts Row

The dashboard should include:

- Revenue vs Equilibrium
- Department Exposure
- Bonus vs Salary Increment
- Profit Flow

## Teal Result Cards

The result cards should show:

- Total Incentive Exposure
- Profit Before Incentives
- Profit After Incentives
- Equilibrium Revenue
- Additional Revenue Needed
- Maximum Safe Payout
- Sustainability Ratio
- Maximum Safe Monthly Increment
- Break-Even Days
- Status

## Revenue Vs Equilibrium Chart

Show:

- Current Revenue
- Equilibrium Revenue

If revenue is above equilibrium, the plan is affordable. If revenue is below equilibrium, the company needs additional revenue.

## Department Exposure Chart

Group exposure by department:

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

Only departments with exposure above zero should be shown.

## Bonus Vs Salary Increment Chart

Split total exposure into:

- Bonus Exposure
- Salary Increment Exposure

This distinction must be visible because bonus costs reset and salary increments continue.

## Profit Flow Waterfall

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

## Advanced Collapsible Section

The following should be advanced optional content, not part of the crowded main dashboard:

- 12-month projection
- 24-month projection
- Revenue vs compensation crossing point

## Status Display

The UI should display:

- Financial Status
- Sustainability Status
- Projection Status, when advanced projection is enabled

Financial Status values:

- Safe
- Close
- Risky
- Needs Exchange Rate
- Needs More Numbers

Never show `NaN`, `Infinity`, `undefined`, or broken values.

## Current Implementation Anchors

| Area | File |
| --- | --- |
| Simulation UI | `../../src/components/SimulationClient.tsx` |
| Set Incentives UI | `../../src/components/SetIncentivesClient.tsx` |
| App routes | `../../src/app` |

## AI Assistant Notes

UI work should not change formulas. If the UI needs a new calculated value, first identify whether it already exists in [Financial Formulas](../finance/financial-formulas.md) or whether the business owner must approve a new formula.
