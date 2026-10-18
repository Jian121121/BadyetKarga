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

## Web hosting
- Vercel project `badyetkarga`, linked to GitHub `Jian121121/BadyetKarga`; every push to `main` rebuilds
- `vercel.json`: Vercel runs `npx expo export -p web`, serves `dist/`, rewrites all paths to `/` (single-page app)
- Build on Vercel, not locally: the CLI won't upload `dist/assets/node_modules/` (fonts/icons)
- `EXPO_PUBLIC_*` keys live in Vercel env vars (production + preview); they ship in the bundle
- Wide browser windows (≥600px) show a centered 430px phone frame (`shared/web/installPhoneFrame.ts`, called from `index.ts`); screens size from `useAppDimensions()` instead of `useWindowDimensions()`
- `metro.config.js` adds `wasm` so `expo-sqlite`'s web worker resolves (web still uses the mock)

## Diagrams
- `docs/system-flowchart.mmd`, `docs/system-flowchart.drawio` (A4 portrait, one page)
- `docs/database-erd.mmd`, `docs/database-erd.drawio` (A4 portrait, one page)
