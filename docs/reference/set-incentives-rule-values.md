# Set Incentives Rule Values

## Purpose

This document preserves the current configured rule values from the CareBearBooks incentive handoff. These values should be seeded or configured in Set Incentives, not hardcoded in calculation logic.

## What Belongs Here

- Current rule amounts.
- Current thresholds.
- Current percentage rates.
- Current milestone counts.
- Current billing thresholds.
- Current configured rule values from the handoff.

Formula definitions belong in [Financial Formulas](../finance/financial-formulas.md). Rule interpretation belongs in [Incentive Engine](../engines/incentive-engine.md).

## Source-Of-Truth Rule

The simulation must pull these values from Set Incentives. They are listed here for documentation and seeding traceability.

## Current Configured Rules

- General salary increment: KSh 3,000/month
- Sales 10-client milestone: KSh 5,000/month every 10 active/paying clients
- Sales independent acquisition: KSh 3,500
- Sales with Andrew support: KSh 2,000
- Consultation helper: KSh 1,500
- Tax-only client with Andrew support: KSh 500
- Referral bonus: KSh 1,500
- Payroll onboarding: KSh 500
- Payroll accuracy: KSh 2,000 quarterly
- Payroll run completion: KSh 1,500 quarterly
- Payroll retention: KSh 1,500 every 12 months
- Bookkeeping accuracy: KSh 2,000 quarterly
- Bookkeeping turnaround: KSh 1,500 quarterly
- Books cleanup standard: KSh 1,000
- Books cleanup complex: KSh 2,000
- Bookkeeping retention: KSh 2,000 every 12 months
- Combined bookkeeping/payroll retention: KSh 3,000 every 12 months
- Tax reward: 10% of billed amount
- 1040 threshold: over $250
- 1040 reward: KSh 500
- Non-1040 threshold: over $750
- Non-1040 reward: KSh 1,000
- Tax accuracy: KSh 3,000 quarterly
- Tax deadline adherence: KSh 2,000 quarterly
- Complex return standard: KSh 500
- Highly complex return: KSh 1,000
- Billing collection floor: 95%
- Billing full payout threshold: 100%
- Billing max payout: KSh 5,000
- Marketing views threshold: 500 views
- Face/person reward: KSh 1,000 per 500 views
- Editor reward: KSh 500 per 500 views
- YouTube subscriber milestone: 1,000 subscribers
- TikTok follower milestone: 5,000 followers
- Top contributors: top 3 editors and top 3 faces
- Marketing milestone increment: KSh 3,000/month
- EA Level 1: KSh 15,000/month
- EA Level 2: KSh 20,000/month
- EA Level 3: KSh 5,000/month
- Processes model threshold: 2 models
- Processes query response threshold: 24 hours

## AI Assistant Notes

Do not copy these values into formula code. If code needs one of these values, read it from the configured Set Incentives rule record.
