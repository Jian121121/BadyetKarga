import { create } from 'zustand';
import {
  saveHouseholdSettings,
  getHouseholdSettings,
  parseMealStyles,
  parseSelectedGoals,
  type HouseholdSettings,
} from '../services/database/householdRepository';
import { recommendBudgetBufferPercentage } from '../shared/utils/householdServing';

function withAutomaticBudgetBuffer(settings: HouseholdSettings): HouseholdSettings {
  return {
    ...settings,
    budgetBufferPercentage: recommendBudgetBufferPercentage({
      weeklyBudget: settings.weeklyBudget,
      goals: parseSelectedGoals(settings),
      mealStyles: parseMealStyles(settings),
    }),
  };
}

interface HouseholdState {
  /** undefined = not loaded yet; null = loaded, no settings; object = setup complete */
  settings: HouseholdSettings | null | undefined;
  loadSettings: (userId: number) => Promise<void>;
  saveSettings: (settings: HouseholdSettings) => Promise<void>;
  clearSettings: () => void;
}

let loadGeneration = 0;

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  settings: undefined,

  loadSettings: async (userId) => {
    const generation = ++loadGeneration;
    // Only show loading flash when we have nothing yet (avoids kicking RootNavigator).
    if (get().settings === undefined) set({ settings: undefined });
    const settings = await getHouseholdSettings(userId);
    if (generation !== loadGeneration) return;
    set({ settings: settings ? withAutomaticBudgetBuffer(settings) : settings });
  },

  saveSettings: async (settings) => {
    const next = withAutomaticBudgetBuffer(settings);
    await saveHouseholdSettings(next);
    set({ settings: next });
  },

  clearSettings: () => {
    loadGeneration += 1;
    set({ settings: undefined });
  },
}));
