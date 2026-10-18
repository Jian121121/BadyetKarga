# Graph Report - badyetkarga  (2026-10-12)

## Corpus Check
- 156 files · ~1,397,606 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 979 nodes · 2972 edges · 75 communities (47 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9611909e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuthStore
- groceryGenerator.ts
- AddDishScreen.tsx
- HomeDashboardScreen.tsx
- AnalyticsDashboardScreen.tsx
- radii
- typography
- WizardFamilyScreen.tsx
- theme/index.ts
- religion.ts
- expo
- notificationStore.ts
- analyticsRepository.ts
- DishLibraryScreen.tsx
- mealPlanStore.ts
- week.ts
- Changelog.md
- weeklyPlanGenerator.ts
- MainTabNavigator.tsx
- dependencies
- spacing
- dishRepository.ts
- Positive & Negative Test Cases
- groceryStore.ts
- EditHouseholdScreen.tsx
- expo-font
- package.json
- CustomTabBar.tsx
- EmptySlotPicker.tsx
- Mermaid AI Skills
- devDependencies
- tsconfig.json
- FadeIn.web.tsx
- react-dom
- expo-build-properties
- expo-dev-client
- @expo-google-fonts/plus-jakarta-sans
- expo-notifications
- expo-splash-screen
- appMetaRepository.ts
- omniroute
- framer-motion
- motion
- AGENTS.md
- react-native
- react-native-safe-area-context
- expo-blur
- @react-navigation/bottom-tabs
- @react-navigation/native
- zustand
- expo-crypto
- @expo-google-fonts/inter
- expo-image-picker
- expo-sqlite
- expo-status-bar
- expo-web-browser
- copilot-instructions.md
- react
- react-native-web
- @react-navigation/native-stack

## God Nodes (most connected - your core abstractions)
1. `useAuthStore` - 77 edges
2. `useMealPlanStore` - 57 edges
3. `colors` - 50 edges
4. `spacing` - 50 edges
5. `typography` - 49 edges
6. `radii` - 47 edges
7. `useGroceryStore` - 46 edges
8. `notify()` - 37 edges
9. `useHouseholdStore` - 34 edges
10. `confirmAction()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useAuthStore`  [EXTRACTED]
  App.tsx → src/store/authStore.ts
- `App()` --calls--> `initDatabase()`  [EXTRACTED]
  App.tsx → src/services/database/db.ts
- `App()` --calls--> `seedDishes()`  [EXTRACTED]
  App.tsx → src/services/database/seedData.ts
- `generateWeeklyPlan()` --indirect_call--> `normalizeGoalKey()`  [INFERRED]
  src/algorithms/weeklyPlanGenerator.ts → src/shared/constants/householdGoals.ts
- `useMealPlanStore` --calls--> `collectAllergies()`  [EXTRACTED]
  src/store/mealPlanStore.ts → src/algorithms/allergyFilter.ts

## Import Cycles
- None detected.

## Communities (75 total, 28 thin omitted)

### Community 0 - "useAuthStore"
Cohesion: 0.08
Nodes (60): GoogleSignInButton(), Props, styles, ForgotPasswordScreen(), RegisterScreen(), assertFirebaseConfig(), firebaseConfig, getFirebaseAuth() (+52 more)

### Community 1 - "groceryGenerator.ts"
Cohesion: 0.13
Nodes (28): buildPantryStock(), buyableQuantity(), ceilTo(), consumePantry(), convertAmount(), GeneratedGroceryItem, generateGroceryList(), PantryStock (+20 more)

### Community 2 - "AddDishScreen.tsx"
Cohesion: 0.06
Nodes (57): AddDishScreen(), BASE_SERVING_OPTIONS, CATEGORIES, DraftIngredient, emptyIngredient(), formatPeso(), isBlankRow(), MEAL_TYPES (+49 more)

### Community 3 - "HomeDashboardScreen.tsx"
Cohesion: 0.05
Nodes (70): formatBudgetBufferSummary(), BudgetOptimizationResult, OptimizationSuggestion, optimizeBudget(), Stack, Stack, GroceriesStackParamList, BudgetOptimizationScreen() (+62 more)

### Community 4 - "AnalyticsDashboardScreen.tsx"
Cohesion: 0.08
Nodes (41): basePercentFor(), BUDGET_TIERS, BudgetBufferInput, BudgetBufferResult, calculateBudgetBuffer(), GOAL_WEIGHTS, goalAdjustmentFor(), householdAdjustmentFor() (+33 more)

### Community 5 - "radii"
Cohesion: 0.14
Nodes (19): ProfileStackParamList, styles, COMMON_PANTRY_ITEMS, styles, Props, styles, styles, BackHeader() (+11 more)

### Community 6 - "typography"
Cohesion: 0.10
Nodes (28): Stack, AuthStackParamList, RootStackParamList, LoginScreen(), Props, styles, OnboardingScreen(), Props (+20 more)

### Community 7 - "WizardFamilyScreen.tsx"
Cohesion: 0.08
Nodes (44): Stack, SetupWizardStackParamList, styles, WizardShell(), WizardShellProps, ALLERGIES, DIETS, Props (+36 more)

### Community 8 - "theme/index.ts"
Cohesion: 0.15
Nodes (12): FamilyCountCardProps, styles, MealCardProps, styles, QuickActionsProps, styles, colors, ColorToken (+4 more)

### Community 9 - "religion.ts"
Cohesion: 0.14
Nodes (19): FoodRestrictionPicker(), Props, styles, DishFacts, easterSunday(), escapeRegExp(), FOOD_RESTRICTION_OPTIONS, FoodRestrictionKey (+11 more)

### Community 10 - "expo"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId, expo, android (+19 more)

### Community 11 - "notificationStore.ts"
Cohesion: 0.16
Nodes (21): MealPlanEntry, CATEGORY_TINT, NotificationRow(), NotificationsModal(), Props, styles, AppNotification, buildNotifications() (+13 more)

### Community 12 - "analyticsRepository.ts"
Cohesion: 0.13
Nodes (25): aggregateMostPurchased(), AnalyticsInput, AnalyticsSummary, archiveEstimatedWeekSpend(), buildEstimateAccuracy(), buildWeeklyBars(), ESTIMATE_ITEM_NAME, estimateTripIds() (+17 more)

### Community 13 - "DishLibraryScreen.tsx"
Cohesion: 0.15
Nodes (17): ALLERGEN_SYNONYMS, collectAllergies(), escapeRegExp(), expandAllergen(), filterDishesByAllergies(), textMatchesAllergen(), Stack, PlannerStackParamList (+9 more)

### Community 14 - "mealPlanStore.ts"
Cohesion: 0.19
Nodes (21): collectDietaryRestrictions(), GeneratePlanResponse, Dish, getMealExceptions(), addMealPlanEntry(), clearMealPlanForUser(), clearMealPlanForWeek(), getMealPlanForUser() (+13 more)

### Community 15 - "week.ts"
Cohesion: 0.20
Nodes (15): missingItemsForDish(), syncMealShoppingReminders(), buildEatersBySlot(), eatersForSlot(), formatEaterNames(), formatEaters(), NamedMember, dateForWeekDay() (+7 more)

### Community 16 - "Changelog.md"
Cohesion: 0.09
Nodes (26): Algorithms, Analytics (`analyticsRepository.ts` + `householdInsights.ts`), Food rules (`shared/constants/religion.ts`), Goal scoring (`scoreDishMultiGoal`), Pantry matching (`shared/utils/ingredientKey.ts`), Visitor buffer, Architecture, Data flow (+18 more)

### Community 17 - "weeklyPlanGenerator.ts"
Cohesion: 0.21
Nodes (16): dishContainsAllergen(), dishViolatesDietaryRestriction(), calculateIncrementalCost(), cookTimeCapMinutes(), GeneratePlanRequest, generateWeeklyPlan(), MealExceptionParam, PLAN_DAYS (+8 more)

### Community 18 - "MainTabNavigator.tsx"
Cohesion: 0.06
Nodes (33): App(), plugins, styles, expo-font, expo-secure-store, expo-sqlite, expo-status-bar, expo-web-browser (+25 more)

### Community 19 - "dependencies"
Cohesion: 0.13
Nodes (15): expo, expo-auth-session, expo-constants, expo-secure-store, @expo/vector-icons, firebase, dependencies, expo (+7 more)

### Community 20 - "spacing"
Cohesion: 0.13
Nodes (17): LEGAL_DOCUMENTS, LegalDocument, LegalDocumentKey, LegalSection, Props, styles, LegalDocumentScreen(), Props (+9 more)

### Community 21 - "dishRepository.ts"
Cohesion: 0.18
Nodes (18): DishIngredient, getIngredientsForDish(), getIngredientsForDishes(), addCustomDish(), allWebBundles(), deleteCustomDish(), getAllDishes(), getWebIngredients() (+10 more)

### Community 22 - "Positive & Negative Test Cases"
Cohesion: 0.08
Nodes (23): BadyetKarga — Test Scenarios & Test Cases, Main Features / Modules, Positive & Negative Test Cases, Summary Map, Template A: Positive / Happy Path Test Case, Template A: Positive / Happy Path Test Case, Template A: Positive / Happy Path Test Case, Template A: Positive / Happy Path Test Case (+15 more)

### Community 23 - "groceryStore.ts"
Cohesion: 0.30
Nodes (15): getAvailabilityForMembers(), addGroceryItem(), deleteGroceryItem(), getGroceryItems(), GroceryItem, removeCheckedGroceryItems(), replaceGroceryList(), saveWebGrocery() (+7 more)

### Community 24 - "EditHouseholdScreen.tsx"
Cohesion: 0.14
Nodes (26): DishDetailsScreen(), Props, styles, BUDGET_PRESETS, EditHouseholdScreen(), parseBudget(), Props, styles (+18 more)

### Community 26 - "package.json"
Cohesion: 0.20
Nodes (9): main, name, private, scripts, android, ios, start, web (+1 more)

### Community 27 - "CustomTabBar.tsx"
Cohesion: 0.15
Nodes (13): IconName, styles, TAB_META, AppDialog(), styles, GlassView(), GlassViewProps, styles (+5 more)

### Community 28 - "EmptySlotPicker.tsx"
Cohesion: 0.29
Nodes (7): DAY_NAMES, EmptySlotPicker(), EmptySlotPickerProps, groupByDay(), MEAL_ICONS, OpenMealSlot, styles

### Community 29 - "Mermaid AI Skills"
Cohesion: 0.15
Nodes (12): Diagram editing & preview, Docs, Generate diagrams (GitHub Copilot required), Install / update this pack, LM Tools — call these for every diagram interaction, Mermaid AI Skills, Mermaid Chart cloud, @mermaid-chart slash commands (+4 more)

### Community 30 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, @types/react, typescript, @types/react, typescript

### Community 31 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 39 - "appMetaRepository.ts"
Cohesion: 0.27
Nodes (10): clearAppMeta(), deleteAppMeta(), getAppMeta(), META_KEYS, MetaMap, saveWebMeta(), setAppMeta(), webKey() (+2 more)

## Knowledge Gaps
- **323 isolated node(s):** `omniroute`, `styles`, `name`, `slug`, `version` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `useAuthStore` to `AddDishScreen.tsx`, `HomeDashboardScreen.tsx`, `AnalyticsDashboardScreen.tsx`, `radii`, `typography`, `WizardFamilyScreen.tsx`, `notificationStore.ts`, `DishLibraryScreen.tsx`, `mealPlanStore.ts`, `MainTabNavigator.tsx`, `spacing`, `dishRepository.ts`, `EditHouseholdScreen.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `plugins` connect `MainTabNavigator.tsx` to `expo`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `expo` connect `expo` to `MainTabNavigator.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `omniroute`, `styles`, `name` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuthStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08088531187122737 - nodes in this community are weakly interconnected._
- **Should `groceryGenerator.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1268939393939394 - nodes in this community are weakly interconnected._
- **Should `AddDishScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05794556628621598 - nodes in this community are weakly interconnected._