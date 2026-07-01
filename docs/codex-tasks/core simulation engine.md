\# CareBearBooks Incentive Simulation Model — Core Simulation Engine



You are working on the CareBearBooks Incentive Simulation Model.



Your task is to build or improve the Core Simulation Engine. This engine handles the main math and calculation logic for the incentive simulation model.



The business goal of the model is to answer this question:



Can CareBearBooks afford this incentive plan without damaging company profit?



The simulation must calculate whether selected incentives are affordable after considering revenue, direct costs, salary payouts, protected profit, incentive exposure, qualifying employees, currency conversion, and period conversion.



Primary files to work on:

\- src/lib/simulation-formulas.ts

\- src/lib/currency.ts

\- src/lib/types.ts

\- src/components/SimulationClient.tsx



Core calculation areas to implement or improve:

\- Currency conversion

\- Monthly / quarterly / annual period conversion

\- Incentive exposure calculation

\- Qualifying employees calculation

\- Profit before incentives

\- Profit after incentives

\- Maximum safe payout

\- Equilibrium revenue

\- Additional revenue needed

\- Safe / Close / Risky status

\- Formula helper functions

\- Prevention of NaN, Infinity, undefined, null, or broken display values



\## 1. Core formulas



Use these formulas as the source of truth:



Profit Before Incentives =

Revenue - Direct Costs - Salary Payouts



Bonus Exposure =

SUM(all selected incentives where incentive type is Bonus or one-time reward)



Salary Increment Exposure =

SUM(all selected incentives where isPermanentSalaryIncrement = true)



Total Incentive Exposure =

Bonus Exposure + Salary Increment Exposure



Profit After Incentives =

Profit Before Incentives - Total Incentive Exposure



Maximum Safe Payout =

Profit Before Incentives - Profit to Protect



Equilibrium Revenue =

Direct Costs + Salary Payouts + Total Incentive Exposure + Profit to Protect



Additional Revenue Needed =

MAX(0, Equilibrium Revenue - Revenue)



Revenue Surplus =

Revenue - Equilibrium Revenue



Total Compensation Cost =

Salary Payouts + Bonus Exposure + Salary Increment Exposure



Sustainability Ratio =

Total Compensation Cost / Revenue



Base Salary Ratio =

Salary Payouts / Revenue



Bonus Ratio =

Bonus Exposure / Revenue



Salary Increment Ratio =

Salary Increment Exposure / Revenue



Important clarification:

Total Incentive Exposure has one canonical definition:



Total Incentive Exposure =

Bonus Exposure + Salary Increment Exposure



Qualifying employee counts are inputs used to calculate individual incentive exposure. They are not a separate top-level exposure bucket added on top of bonus exposure and salary increment exposure.



Maximum Safe Payout should not be clamped to zero in the formula layer. It can be negative. A negative value is meaningful because it shows the company is already below protected profit before paying incentives. If the UI needs to display this differently, handle that in the presentation layer, not in the formula itself.



When Revenue is 0, missing, invalid, or non-finite, ratio helper functions should never return NaN or Infinity. Return 0 as the raw numeric fallback, while the overall simulation status should be Needs More Numbers.



\## 2. Affordability status logic



The model should return one of these statuses:



Safe:

Profit after incentives is above protected profit with enough buffer.



Close:

Profit after incentives is still above protected profit, but the remaining gap is small.



Risky:

Profit after incentives is below protected profit.



Needs Exchange Rate:

Currency conversion is required but the exchange rate is missing, zero, invalid, or unusable.



Needs More Numbers:

Required inputs are missing, invalid, or not enough to calculate the simulation safely.



Gap =

Profit After Incentives - Profit to Protect



Status precedence must be evaluated in this fixed order. The first matching condition wins:



1\. Needs More Numbers

Required inputs are missing, null, undefined, NaN, non-finite, or otherwise unusable.



Required inputs:

\- Revenue: required, no default

\- Salary Payouts: required, no default

\- Direct Costs: optional, defaults to 0 if missing

\- Profit to Protect: optional, defaults to 0 if missing

\- Selected Incentives: optional; empty selection is valid and exposure should be 0



2\. Needs Exchange Rate

Display currency is USD and the exchange rate is missing, zero, invalid, or non-finite.



Only check this after required base inputs are valid.



3\. Risky

Gap < 0



4\. Close

Gap >= 0 and Gap <= close buffer



If Gap == 0 exactly, treat the plan as Close, not Safe.



5\. Safe

Gap > close buffer



Do not hardcode the close buffer if a configurable value already exists. If no configurable value exists, create a clearly named default constant such as DEFAULT\_CLOSE\_BUFFER\_KSH.



Use a flat KSh close buffer unless the current codebase already has a different configured approach.



\## 3. Currency rules



Internal calculations should run in KSh.



The UI can display values in KSh or USD.



Use this formula when exchange rate is stored as KSh per 1 USD:



Value\_USD =

Value\_KSh / Exchange Rate



Before implementing, check the existing exchange rate field or config and confirm the direction. If the codebase stores exchange rate as USD-per-KSh instead of KSh-per-USD, invert the formula accordingly.



If the user selects USD display and the exchange rate is missing, zero, invalid, or not finite:

\- Return Needs Exchange Rate

\- Avoid showing broken numbers

\- Do not output NaN, Infinity, undefined, or invalid formatted values



Currency helpers should:

\- Accept numeric input safely

\- Normalize empty, null, undefined, NaN, Infinity, and non-numeric values

\- Avoid division by zero

\- Return safe fallback values

\- Clearly separate internal KSh math from display currency conversion



\## 4. Period conversion rules



The simulation must support:

\- Monthly

\- Quarterly

\- Annual



Permanent monthly salary increments:

\- Monthly view: use monthly amount

\- Quarterly view: multiply by 3

\- Annual view: multiply by 12



Quarterly bonuses:

\- Monthly view: divide by 3

\- Quarterly view: use as-is

\- Annual view: multiply by 4



In monthly view, quarterly bonuses should always be converted to a monthly-equivalent exposure by dividing by 3.



One-time bonuses:

\- Treat as one-time unless a quantity, count, or selected period rule says otherwise.

\- Do not pro-rate one-time bonuses across periods.

\- Count them in full in the period in which they are paid.

\- Exclude them from other periods unless the data model explicitly says they apply there.



Because one-time bonuses are not pro-rated, Sustainability Ratio and Bonus Ratio may spike in the period where the one-time bonus is paid. Do not smooth or average this unless the business logic explicitly requires amortization.



The period conversion logic should be centralized in helper functions, not repeated across components.



\## 5. Incentive exposure rules



The engine should calculate total incentive exposure from selected incentive rules.



Set Incentives should be treated as the source of truth for:

\- Incentive amounts

\- Salary increment amounts

\- Trigger counts

\- Thresholds

\- Percentages

\- Billing thresholds

\- Time periods

\- Approval rules

\- Evidence rules

\- Formula variables



Do not hardcode incentive values such as:

\- 10 clients

\- 12 months

\- 500 views

\- 1,000 subscribers

\- 5,000 followers

\- 95% collection floor

\- Fixed payout amounts

\- Salary increment amounts

\- Billing thresholds



Only use these values if they come from configured Set Incentives data or an existing typed default.



The model must support:

\- Fixed bonuses

\- One-time rewards

\- Permanent salary increments

\- Percentage-based incentives

\- Milestone/block incentives

\- Qualifying employee counts

\- Selected planner rules

\- Incentives linked to client revenue



For a fixed employee-based bonus:



Exposure =

Incentive Amount × Qualifying Employees



For percentage incentives:



Exposure =

Base Amount × Percentage



Percentage handling must be consistent. Internally, normalize percentages to decimal form.



Examples:

\- 10 should become 0.10

\- 10% should become 0.10

\- 0.10 should remain 0.10



Use a helper such as normalizePercentage at the boundary before calculation.



\## 6. Bonus vs salary increment separation



The engine must separately calculate:

\- Bonus exposure

\- Salary increment exposure

\- Total incentive exposure



Bonus Exposure =

SUM(all selected incentives where incentive type is Bonus or one-time reward)



Salary Increment Exposure =

SUM(all selected incentives where isPermanentSalaryIncrement = true)



Total Incentive Exposure =

Bonus Exposure + Salary Increment Exposure



Salary increments are permanent and cumulative.

Bonuses reset by period.



Do not mix temporary bonus exposure with permanent salary increment exposure.



\## 7. Qualifying employees



The engine should support qualifying employee counts for each selected incentive.



Rules:

\- Missing qualifying count should default safely to 0 unless the UI intentionally requires it as a missing input.

\- Negative qualifying counts should not produce negative exposure.

\- Decimal employee counts must be clamped to non-negative first, then floored to a whole number.



Examples:

\- -2.7 becomes 0

\- 4.8 becomes 4

\- undefined becomes 0

\- NaN becomes 0



Create a centralized helper such as calculateQualifyingEmployees or normalizeQualifyingEmployees.



Exposure should recalculate when the qualifying employee count changes.



\## 8. No broken math



The engine must never output:

\- NaN

\- Infinity

\- -Infinity

\- undefined

\- null in numeric UI fields

\- broken formatted currency values



Create or improve helper functions such as:

\- toSafeNumber

\- clampNonNegative

\- safeDivide

\- safeMultiply

\- safeCurrencyValue

\- formatSimulationMoney

\- convertDisplayCurrency

\- normalizePercentage

\- convertPeriodAmount

\- calculateProfitBeforeIncentives

\- calculateProfitAfterIncentives

\- calculateMaximumSafePayout

\- calculateEquilibriumRevenue

\- calculateAdditionalRevenueNeeded

\- calculateRevenueSurplus

\- calculateSimulationStatus

\- calculateQualifyingEmployees or normalizeQualifyingEmployees



Use existing naming conventions if similar helpers already exist.



\## 9. Type safety



Update src/lib/types.ts as needed.



The types should clearly represent:

\- Simulation period: monthly, quarterly, annual

\- Display currency: KSh, USD

\- Simulation status: Safe, Close, Risky, Needs Exchange Rate, Needs More Numbers

\- Incentive type

\- Incentive rule

\- Selected incentive

\- Qualifying employee assumptions

\- Simulation input

\- Simulation result

\- Exposure breakdown:

&#x20; - Bonus Exposure

&#x20; - Salary Increment Exposure

&#x20; - Total Incentive Exposure



Department exposure breakdown is out of scope for this task unless it already exists as a working feature in the current codebase.



If department-level exposure grouping already exists:

\- Preserve it as-is

\- Do not break it

\- Do not redesign it



If it does not exist:

\- Do not add it in this task

\- It should be handled in a separate task with its own spec



Avoid using any unless absolutely necessary.

Prefer explicit types and reusable interfaces.



\## 10. SimulationClient integration



Update src/components/SimulationClient.tsx only as needed to connect the UI to the improved formula engine.



The component should not contain duplicated business math if the logic belongs in:

\- src/lib/simulation-formulas.ts

\- src/lib/currency.ts



SimulationClient should:

\- Pass clean inputs into the formula engine

\- Render safe calculated outputs

\- Show status clearly

\- Avoid displaying NaN, Infinity, undefined, null, or broken values

\- Recalculate when revenue, direct costs, salary payouts, protected profit, exchange rate, selected incentives, qualifying counts, currency, or period changes

\- Preserve existing UI behavior unless the current behavior is broken

\- If displaying Maximum Safe Payout when it is negative, present it clearly as a deficit or shortfall instead of clamping it to zero



\## 11. Expected output from the implementation



After this task, the Core Simulation Engine should calculate:



\- Revenue

\- Direct costs

\- Salary payouts

\- Profit before incentives

\- Bonus exposure

\- Salary increment exposure

\- Total incentive exposure

\- Profit after incentives

\- Profit to protect

\- Maximum safe payout

\- Equilibrium revenue

\- Additional revenue needed

\- Revenue surplus or shortfall

\- Sustainability ratio

\- Base salary ratio

\- Bonus ratio

\- Salary increment ratio

\- Status:

&#x20; - Safe

&#x20; - Close

&#x20; - Risky

&#x20; - Needs Exchange Rate

&#x20; - Needs More Numbers

\- Display values in KSh or USD

\- Monthly, quarterly, or annual exposure



\## 12. Acceptance criteria



The task is complete when:



\- All formulas match the CareBearBooks Incentive Simulation Model logic in this prompt.

\- Total Incentive Exposure is calculated as Bonus Exposure + Salary Increment Exposure.

\- Qualifying employee counts are used as inputs to selected incentive calculations, not as a separate top-level exposure bucket.

\- All core math is centralized in reusable helper functions.

\- Currency conversion works safely for KSh and USD.

\- Exchange rate direction is checked against the existing data model before implementation.

\- Missing or invalid exchange rates produce Needs Exchange Rate instead of broken numbers.

\- Monthly, quarterly, and annual period conversions work consistently.

\- Quarterly bonuses are converted to monthly equivalent by dividing by 3 in monthly view.

\- One-time bonuses are not silently pro-rated or amortized.

\- Incentive exposure correctly accounts for selected incentives and qualifying employees.

\- Qualifying employee counts are clamped non-negative and floored.

\- Bonus exposure and salary increment exposure are calculated separately.

\- Profit before incentives, profit after incentives, maximum safe payout, equilibrium revenue, additional revenue needed, and revenue surplus are calculated correctly.

\- Maximum Safe Payout is not clamped in the formula layer and can be negative.

\- Safe, Close, Risky, Needs Exchange Rate, and Needs More Numbers statuses work correctly.

\- Statuses follow the fixed precedence order:

&#x20; 1. Needs More Numbers

&#x20; 2. Needs Exchange Rate

&#x20; 3. Risky

&#x20; 4. Close

&#x20; 5. Safe

\- Gap == 0 is treated as Close.

\- No output displays NaN, Infinity, -Infinity, undefined, null, or invalid currency.

\- Ratio helpers safely handle zero or invalid revenue without producing NaN or Infinity.

\- Types are updated and strict enough to prevent invalid simulation data.

\- Department exposure breakdown is left untouched unless it already exists.

\- SimulationClient uses formula helpers instead of duplicating business logic.

\- Existing UI behavior is preserved unless it conflicts with the documented model.

\- The code is readable, maintainable, and easy to test.



Do not redesign the whole application.

Do not introduce unrelated features.

Do not hardcode business incentive values that should come from Set Incentives.

Do not add department breakdown logic unless it already exists.

Focus only on making the Core Simulation Engine reliable, typed, safe, and consistent with the CareBearBooks Incentive Simulation Model.

