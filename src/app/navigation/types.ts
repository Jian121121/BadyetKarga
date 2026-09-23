// src/app/navigation/types.ts

// ── Auth Stack ──────────────────────────────────────────
// Screens available before the user is logged in
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  LegalDocument: { document: 'terms' | 'privacy' };
};

// ── Setup Wizard Stack ──────────────────────────────────
// Shown after login when household settings don't exist yet.
// 9 steps: Welcome → data collection → Complete (commits everything).
export type SetupWizardStackParamList = {
  Welcome: undefined;
  Household: undefined;
  Goal: undefined;
  Family: undefined;
  Allergies: undefined;
  Availability: undefined;
  Pantry: undefined;
  Cooking: undefined;
  Complete: undefined;
};

// ── Main Tab Navigator ──────────────────────────────────
// The 5 bottom tabs, confirmed from Stitch screens
export type MainTabParamList = {
  HomeTab: undefined;
  PlannerTab: undefined;
  GroceriesTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};

// ── Per-tab nested stacks ───────────────────────────────
// Each tab is itself a Stack, so screens can push on top
// without losing the tab bar (e.g. Planner -> DishLibrary -> DishDetails)

export type HomeStackParamList = {
  HomeDashboard: undefined;
};

export type PlannerStackParamList = {
  MealPlanner: undefined;
  DishLibrary: { lockSlot?: boolean };
  DishDetails: { dishId: string; fromPlanner?: boolean; pickSlot?: boolean };
  AddDish: undefined; // user-created dish with own ingredients & prices
};

export type GroceriesStackParamList = {
  GroceryList: undefined;
  BudgetOptimization: undefined;
  ShoppingMode: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  FamilyManagement: undefined;
  WeeklyAvailability: undefined;
  Pantry: undefined;
  EditHousehold: undefined;
  ChangePassword: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

// ── Root Navigator ──────────────────────────────────────
// The top-level switch between Auth / Wizard / Main app
export type RootStackParamList = {
  AuthStack: undefined;
  SetupWizardStack: undefined;
  MainTabs: undefined;
};