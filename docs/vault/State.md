# State (Zustand)

Back to [[Home]]

`src/store/`:
- `authStore`: session, current user, register/login → [[Auth]]
- `householdStore`: household settings. **Sole writer of `budgetBufferPercentage`**:
  `saveSettings` always recalculates it via [[Algorithms]] `calculateBudgetBuffer`
  (callers can't pass it). `syncCompositionFromMembers` re-saves after family
  add/edit/remove (called by `familyStore`). `loadSettings` migrates stale values.
- `setupWizardStore`: first-run wizard answers
- `familyStore`, `availabilityStore`, `mealPlanStore`, `groceryStore`
- `groceryStore.regenerate` keeps ticks (by `ingredientKey`); `editPrice` + Shopping Mode prices feed price memory; `completeShopping` saves only ticked items (partial trips OK)
- `pantryStore`: `addItem` upserts by `ingredientKey()`; every change regenerates the
  grocery list and the planner's `lastGroceryEstimate`
- `notificationStore`: in-app notifications
- `dialogStore`: global `AppDialog` (used by `shared/utils/confirm.ts`)

Pattern: `create<State>((set, get) => ({ ... }))`; actions set `isLoading`/`error`
and call repositories in [[Database]].
