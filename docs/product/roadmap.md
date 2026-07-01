# Roadmap

## Purpose

This document tracks project direction without changing formulas or inventing business rules. It should help developers and AI coding assistants understand what is foundation, what is next, and what remains optional or advanced.

## What Belongs Here

- Current foundation scope.
- Planned implementation areas.
- Optional advanced features.
- Documentation expansion needs.

Business requirements belong in [Business Requirements](../business/business-requirements.md). Formulas belong in [Financial Formulas](../finance/financial-formulas.md).

## Current Foundation

The current project foundation includes:

- Dashboard route.
- Set Incentives rule engine foundation.
- Incentive Simulation page foundation.
- Seeded CareBearBooks incentive rules.
- Currency API route and manual exchange rate fallback.
- Formula helper foundation.
- Scenario save/load abstraction.
- Chart containers and teal result cards.

## Recommended Model Direction

Use the main affordability formula engine for the current Incentive Simulation.

Add the best parts of the colleague's model:

- Sustainability Ratio
- Base Salary Ratio
- Bonus Ratio
- Salary Increment Ratio
- Maximum Sustainable Monthly Increment
- Break-Even Days
- Optional 12/24-month projection

## Planned Implementation Areas

Future work should fully wire:

- Advanced calculations.
- Persistence.
- Charts.
- Projections.
- Scenario storage.
- Testing.

## Advanced Optional Sections

The 12-month / 24-month projection should remain advanced optional content. It should compare revenue growth against compensation growth and warn when salary increments stack faster than revenue grows.

## AI Assistant Notes

Use this roadmap for sequencing only. Do not treat roadmap items as permission to invent endpoint contracts, schema details, thresholds, or formulas.
