# CareBearBooks Bonus and Salary Increments Simulation

Prompt 1 foundation for a standalone CareBearBooks incentive planning and salary increment simulation model.

## Purpose

This app helps CareBearBooks model incentive affordability before any real claims, approvals, employee balances, or salary increments are affected. It prepares the foundation for answering:

- How much selected bonuses and salary increments may cost.
- Whether profit after incentives stays above protected profit.
- How much additional revenue may be needed.
- Which departments and incentive types create exposure.
- How exchange rate changes affect the model.
- Which Set Incentives rule caused a simulated payout.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server-side API route for currency lookup fallback
- TypeScript seed data and formula helpers for Prompt 1

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Build

```bash
npm run build
```

## Prompt 1 Scope

This is Prompt 1 of 4. It creates:

- Dashboard route
- Set Incentives rule engine foundation
- Incentive Simulation page foundation
- Seeded CareBearBooks incentive rules
- Currency API route and manual exchange rate fallback
- Formula helper foundation
- Scenario save/load abstraction
- Chart containers and teal result cards

Later prompts should fully wire advanced calculations, persistence, charts, projections, scenario storage, and testing.

## Rule Source

Set Incentives seed data is the source of truth for incentive amounts, thresholds, percentages, trigger counts, formula variables, requirements, active status, and trigger messages.

Calculation helpers do not hide incentive payout constants. They read amounts and formula variables from rule records and qualifying assumptions.

## Currency API

The app includes a server route at:

```text
/api/currency/usd-ksh
```

Configure a provider later with:

```bash
CURRENCY_API_URL=
CURRENCY_API_KEY=
```

`CURRENCY_API_URL` may include placeholders such as `{base}`, `{target}`, `{quote}`, and `{apiKey}`. If no provider is configured or the API fails, the simulation keeps working with the editable manual exchange rate.

## GitHub

Codex did not clone, commit, or push this app. The files were built locally in the Codex workspace for manual copy/download and push by the user.
