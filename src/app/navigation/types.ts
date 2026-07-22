// src/app/navigation/types.ts

// ── Auth Stack ──────────────────────────────────────────
// Screens available before the user is logged in
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SetupWizardWelcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// ── Setup Wizard Stack ──────────────────────────────────
// Only reachable after Register — 8 remaining steps + Complete
export type SetupWizardStackParamList = {
  HouseholdInfo: undefined;
  HouseholdGoal: undefined;
  FamilyMembers: undefined;
  AllergiesAndDiet: undefined;
  WeeklyAvailability: undefined;
  PantrySetup: undefined;
  CookingPreferences: undefined;
  WizardComplete: undefined;
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
  DishLibrary: undefined;
  DishDetails: { dishId: string }; // example: DishDetails needs to know WHICH dish
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
};

// ── Root Navigator ──────────────────────────────────────
// The top-level switch between Auth / Wizard / Main app
export type RootStackParamList = {
  AuthStack: undefined;
  SetupWizardStack: undefined;
  MainTabs: undefined;
};