# Algorithms

Back to [[Home]]

`src/algorithms/` (pure functions, no UI):
- `weeklyPlanGenerator.ts`: builds the weekly meal plan from availability + dishes
- `budgetOptimizer.ts`: fits the plan to the weekly budget
- `groceryGenerator.ts`: plan + pantry → grocery list
  - merges by `ingredientKey` + unit family (g/kg, ml/l convert); different units stay separate lines
  - `buyableQuantity()`: kg/l ¼ steps, g/ml 25/50/250 steps, spoons ½, pieces whole
  - remembered real price (`priceMemoryRepository`, per unit) replaces the recipe estimate
  - sections: `shared/constants/groceryCategories.ts` `categorizeIngredient()` (8 market sections, first rule wins); also used by list screen, trips, `budgetOptimizer`
- `allergyFilter.ts`: removes dishes with family allergens
- `budgetBufferCalculator.ts`: `calculateBudgetBuffer()` → emergency reserve %
  - `clamp(basePercent + goalAdjustment + householdAdjustment, 5, 20)`
  - base by budget tier (<2k 5%, <3.5k 7%, <5.5k 9%, <8k 11%, else 12%)
  - goals: Save Money +3, Fewer Trips +2, Less Waste/Family/Healthy +1, Quick −1, Large Portions −2
  - household: +1/senior (max 3), +1.5/infant (max 3)
  - visitor contingency on top of the core: `visitorShare × 100 × 0.3`, clamped 1–8 pts; total cap 25%
    - `visitorShare = visitorLoad / (householdServings + visitorLoad)`, `visitorLoad = visitors × 2/4` (lunch+dinner)
    - e.g. 4 adults: +1 visitor ≈ +3, +2 ≈ +6; small households hit +8 fast
  - UI shows only `formatBudgetBufferSummary(pct, budget, visitors)`: "...based on your budget and goals" (+ ", and visitor buffer" when visitors > 0)
  - Breakdown fields are for docs/demo only; never render them

## Analytics (`analyticsRepository.ts` + `householdInsights.ts`)
- Months use local dates (not UTC); "Weekly grocery estimate" trips (`ESTIMATE_ITEM_NAME`) are excluded from ingredients, categories, accuracy, trip counts
- Money saved = Σ(week budgetSnapshot − week spend) over weeks with trips; none → empty state; negative → "Over Budget"
- Budget cards use actual spend once a trip exists this week, else the planned grocery total (`spendBasis`)
- Predicted spend = avg recorded week × days/7 (falls back to the plan)
- `calculateGoalProgress()`: one metric per selected goal (veg/fish share, protein share, ≤30 min share, unique dishes, shared grocery items, trips ≤2, servings ≥4, budget used)
- `calculateBufferStatus()`: untouched / partial / used / exceeded, plus the visitor part of the reserve
- `calculateServingCost()`: per person per day (adult-equivalents) and per planned serving

## Food rules (`shared/constants/religion.ts`)
- Shared matchers: pork, beef, chicken, fish (incl. patis), shellfish (incl. bagoong), blood, all_meat
- INC → blood; Islam → pork+blood; Judaism → pork+shellfish+blood; SDA → pork+shellfish
- Other / Custom → household's preset picks + free-typed foods (empty = no filter)
  - stored in `customFoodRestrictions` as `{keys, terms}` JSON (legacy bare array still parsed)
  - typed terms: whole-word match on dish name/ingredients, plural-tolerant ("egg" ≠ "eggplant")
- Roman Catholic → `isMeatlessDay()`: Fridays Ash Wed → Holy Sat block `isMeatDish()` (fish/veg OK)
- Meal exceptions override all of these; enforced in generator, `planMeal`, `autoFillDay`, dish screens

## Visitor buffer
- `visitorServingsForMeal()`: extra servings on lunch + dinner only (not breakfast/snack)
- Slot servings = eaters in slot (or household capacity) + visitor servings → recipe scale + grocery qty
- Also adds a visitor contingency (+1–8 pts, cap 25%) to the budget buffer via `calculateBudgetBuffer()`

## Pantry matching (`shared/utils/ingredientKey.ts`)
- `ingredientKey()`: lowercase, singular, aliases (Pepper→black pepper, Itlog→egg, bawang→garlic)
- Used by grocery generator, planner, quick fill, pantry store
- `groceryGenerator` depletes pantry stock across dishes; "on hand"/other units = covered

## Goal scoring (`scoreDishMultiGoal`)
- Food waste: pantry share, reuse of bought items, −1.5 per new ingredient beyond 3
- Grocery trips: pantry share, reuse, −1 per new ingredient, +2 long-keeping staples
- Healthy: +healthy tag/veg/fish/soupy; −4 fried/processed

Inputs come from [[State]] / [[Database]]; eaters per meal via `shared/utils/eaters.ts`.
