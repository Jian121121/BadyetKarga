# Database

Back to [[Home]]

Schema in `src/services/database/db.ts` (expo-sqlite). Web uses `localStorage` mocks
inside each repository. ERD: `docs/database-erd.mmd`, `docs/database-erd.drawio`.

## Tables → repository
- `users` → `userRepository` (see [[Auth]])
- `family_members` → `familyRepository`
- `weekly_availability` → `availabilityRepository`
- `dishes`, `dish_ingredients` → `dishRepository`, `dishIngredientRepository`
- `meal_plan_entries` → `mealPlanRepository`
- `meal_exceptions` → `mealExceptionRepository`
- `pantry_items` → `pantryRepository`
- `grocery_items` → `groceryRepository`
- `shopping_trips`, `purchase_items` → `purchaseRepository`
- `household_settings` → `householdRepository` (`customFoodRestrictions` TEXT JSON, default `'[]'`)
- `dishes` / `dish_ingredients` → `dishRepository`: `getAllDishes(viewerId)` hides other accounts' custom dishes (shared device); `updateCustomDish` owner-only; ingredient `priority: 'low'` = optional
- `app_meta` → `appMetaRepository` (`priceMemory` key → `priceMemoryRepository`: ingredientKey → {unit, unitPrice})
- `pending_registrations`: legacy registration data
- Session: `sessionService` (expo-secure-store)
- Seed data: `seedData.ts`

## Rules
- Emails are stored lowercased; compare with `canonicalEmail` for uniqueness.
- Use parameterized queries (`?`) with `runSync` / `getFirstSync` / `getAllSync`.
