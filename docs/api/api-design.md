# API Design

## Purpose

This document defines API boundaries and documentation standards for the simulator. It is intentionally conservative until production persistence and rule-management decisions are approved.

## What Belongs Here

- Current API routes.
- Future API surface areas.
- Request/response contract standards.
- External integration exclusions.
- Links from API behavior back to formula, data, and engine docs.

Database design belongs in [Database Design](../data/database-design.md). Formula behavior belongs in [Financial Formulas](../finance/financial-formulas.md).

## Current API Surface

### Currency Route

```text
/api/currency/usd-ksh
```

Purpose:

- Fetch or provide USD to KSh exchange-rate support.
- Allow manual exchange rate fallback when no provider is configured or provider lookup fails.

Configuration placeholders from the current project:

```text
CURRENCY_API_URL=
CURRENCY_API_KEY=
```

`CURRENCY_API_URL` may include placeholders such as `{base}`, `{target}`, `{quote}`, and `{apiKey}`.

If no provider is configured or the API fails, the simulation should keep working with the editable manual exchange rate.

## Future API Areas

These areas should be documented here when implemented:

| Area | Responsibility |
| --- | --- |
| Set Incentives API | Read and manage configurable incentive rules and rule values. |
| Simulation API | Optionally run deterministic simulations on the server. |
| Scenario API | Save, list, load, and restore simulation scenarios. |
| Rule Snapshot API | Preserve rule state used by saved scenarios. |
| Audit API | Track created by, created at, and future approval/audit metadata if needed. |

Do not define final endpoint payloads until the persistence model and implementation approach are approved.

## External Integration Exclusions

The simulator should not use:

- QuickBooks API
- Canopy API
- OpenAI API

## API Contract Standards

When an endpoint is added, document:

- Purpose.
- HTTP method and path.
- Authentication assumptions.
- Request fields.
- Response fields.
- Validation behavior.
- Error behavior.
- Formula or engine document that owns the business behavior.
- Persistence document that owns stored data.

## AI Assistant Notes

Do not create APIs that introduce new business rules. API work should expose documented behavior from the engines, formulas, and data model.
