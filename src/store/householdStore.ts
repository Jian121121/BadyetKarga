import { create } from 'zustand';
import {
  saveHouseholdSettings,
  getHouseholdSettings,
  parseSelectedGoals,
  type HouseholdSettings,
} from '../services/database/householdRepository';
import { getFamilyMembers } from '../services/database/familyRepository';
import { calculateBudgetBuffer } from '../algorithms/budgetBufferCalculator';
import { compositionFromMembers } from '../shared/utils/householdServing';

/** budgetBufferPercentage is always derived here; any incoming value is ignored. */
function withCalculatedBudgetBuffer(settings: HouseholdSettings): HouseholdSettings {
  const { bufferPercentage } = calculateBudgetBuffer({
    weeklyBudget: settings.weeklyBudget,
    selectedGoals: parseSelectedGoals(settings),
    adults: settings.adults,
    children: settings.children,
    seniors: settings.seniors,
    infantsToddlers: settings.infantsToddlers,
    visitorBufferServings: settings.visitorBufferServings,
  });
  return { ...settings, budgetBufferPercentage: bufferPercentage };
}

interface HouseholdState {
  /** undefined = not loaded yet; null = loaded, no settings; object = setup complete */
  settings: HouseholdSettings | null | undefined;
  loadSettings: (userId: number) => Promise<void>;
  saveSettings: (settings: Omit<HouseholdSettings, 'budgetBufferPercentage'>) => Promise<void>;
  /** Re-reads family members and re-saves composition + buffer. */
  syncCompositionFromMembers: (userId: number) => Promise<void>;
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
    if (!settings) {
      set({ settings });
      return;
    }
    const next = withCalculatedBudgetBuffer(settings);
    if (next.budgetBufferPercentage !== settings.budgetBufferPercentage) {
      await saveHouseholdSettings(next);
    }
    set({ settings: next });
  },

  saveSettings: async (settings) => {
    const next = withCalculatedBudgetBuffer(settings);
    await saveHouseholdSettings(next);
    set({ settings: next });
  },

  syncCompositionFromMembers: async (userId) => {
    const current = get().settings;
    if (!current || current.userId !== userId) return;
    const composition = compositionFromMembers(await getFamilyMembers(userId));
    await get().saveSettings({
      ...current,
      totalMembers: Math.max(1, composition.totalMembers),
      adults: composition.adults,
      children: composition.children,
      seniors: composition.seniors,
      infantsToddlers: composition.infantsToddlers,
    });
  },

  clearSettings: () => {
    loadGeneration += 1;
    set({ settings: undefined });
  },
}));
