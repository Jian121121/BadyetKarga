# Architecture

Back to [[Home]]

## Folders (`src/`)
- `app/navigation/`: `RootNavigator` → `AuthStack` | `SetupWizardStack` | `MainTabNavigator`
  (tabs: Home, Planner, Groceries, Analytics, Profile stacks; `CustomTabBar`)
- `features/<feature>/{screens,components,hooks}`: analytics, auth, budgetOptimization,
  dishLibrary, familyManagement, groceryList, homeDashboard, mealPlanner, pantry,
  profile, settings, setupWizard, shoppingMode, weeklyAvailability
- `services/auth/`: Firebase, Google, EmailJS OTP → [[Auth]]
- `services/database/`: SQLite repositories → [[Database]]
- `store/`: Zustand stores → [[State]]
- `algorithms/`: pure planning logic → [[Algorithms]]
- `shared/`: `components`, `theme` (colors, typography, spacing, radii), `utils`, `constants`

## Data flow
Screen → Zustand store action → repository (SQLite on native, `localStorage` mock on web).

## Diagrams
- `docs/system-flowchart.mmd`, `docs/system-flowchart.drawio` (A4 portrait, one page)
- `docs/database-erd.mmd`, `docs/database-erd.drawio` (A4 portrait, one page)
