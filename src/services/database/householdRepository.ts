import { Platform } from 'react-native';
import { db } from './db';

export interface HouseholdSettings {
  userId: number;
  householdName: string;
  weeklyBudget: number;
  householdGoal: string;
  currency?: string;
  cookFrequency?: string;
  preferredCookTime?: string;
  /** JSON-encoded string[] of preferred meal styles */
  mealStyles?: string;
  totalMembers?: number;
  adults?: number;
  children?: number;
  seniors?: number;
  infantsToddlers?: number;
  visitorBufferServings?: number;
  budgetBufferPercentage?: number;
  religion?: string;
  /** JSON-encoded string[] of selected goals */
  selectedGoals?: string;
  planDurationDays?: number;
  /** JSON-encoded FoodRestrictionKey[]; used when religion is "Other" or "Custom" */
  customFoodRestrictions?: string;
}

export function parseMealStyles(settings: HouseholdSettings | null | undefined): string[] {
  if (!settings?.mealStyles) return [];
  try {
    const parsed = JSON.parse(settings.mealStyles);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

export function parseSelectedGoals(settings: HouseholdSettings | null | undefined): string[] {
  if (!settings) return ['Save Money'];
  if (settings.selectedGoals) {
    try {
      const parsed = JSON.parse(settings.selectedGoals);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  if (settings.householdGoal) {
    return [settings.householdGoal];
  }
  return ['Save Money'];
}

const WEB_HOUSEHOLD_KEY = 'badyetkarga_web_household';

function loadWebSettings(): Record<number, HouseholdSettings> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEB_HOUSEHOLD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, HouseholdSettings>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveWebSettings(settings: Record<number, HouseholdSettings>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_HOUSEHOLD_KEY, JSON.stringify(settings));
}

const mockSettings: Record<number, HouseholdSettings> =
  Platform.OS === 'web' ? loadWebSettings() : {};

export async function saveHouseholdSettings(settings: HouseholdSettings): Promise<void> {
  if (Platform.OS === 'web') {
    mockSettings[settings.userId] = {
      ...settings,
      totalMembers: settings.totalMembers ?? 1,
      adults: settings.adults ?? 1,
      children: settings.children ?? 0,
      seniors: settings.seniors ?? 0,
      infantsToddlers: settings.infantsToddlers ?? 0,
      visitorBufferServings: settings.visitorBufferServings ?? 0,
      budgetBufferPercentage: settings.budgetBufferPercentage ?? 0,
      religion: settings.religion ?? 'No Religious Restriction',
      selectedGoals: settings.selectedGoals ?? JSON.stringify([settings.householdGoal || 'Save Money']),
      planDurationDays: settings.planDurationDays ?? 7,
      customFoodRestrictions: settings.customFoodRestrictions ?? '[]',
    };
    saveWebSettings(mockSettings);
    return;
  }
  db!.runSync(
    `INSERT OR REPLACE INTO household_settings
       (userId, householdName, weeklyBudget, householdGoal, currency, cookFrequency, preferredCookTime, mealStyles,
        totalMembers, adults, children, seniors, infantsToddlers, visitorBufferServings, budgetBufferPercentage, religion, selectedGoals, planDurationDays,
        customFoodRestrictions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      settings.userId,
      settings.householdName,
      settings.weeklyBudget,
      settings.householdGoal,
      settings.currency ?? 'PHP',
      settings.cookFrequency ?? '',
      settings.preferredCookTime ?? '',
      settings.mealStyles ?? '[]',
      settings.totalMembers ?? 1,
      settings.adults ?? 1,
      settings.children ?? 0,
      settings.seniors ?? 0,
      settings.infantsToddlers ?? 0,
      settings.visitorBufferServings ?? 0,
      settings.budgetBufferPercentage ?? 0,
      settings.religion ?? 'No Religious Restriction',
      settings.selectedGoals ?? JSON.stringify([settings.householdGoal || 'Save Money']),
      settings.planDurationDays ?? 7,
      settings.customFoodRestrictions ?? '[]',
    ]
  );
}

export async function deleteHouseholdSettings(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    delete mockSettings[userId];
    saveWebSettings(mockSettings);
    return;
  }
  db!.runSync(`DELETE FROM household_settings WHERE userId = ?;`, [userId]);
}

export async function getHouseholdSettings(userId: number): Promise<HouseholdSettings | null> {
  if (Platform.OS === 'web') return mockSettings[userId] ?? null;
  const row = db!.getFirstSync<HouseholdSettings>(
    `SELECT * FROM household_settings WHERE userId = ?;`,
    [userId]
  );
  if (!row) return null;
  return {
    ...row,
    totalMembers: row.totalMembers ?? 1,
    adults: row.adults ?? 1,
    children: row.children ?? 0,
    seniors: row.seniors ?? 0,
    infantsToddlers: row.infantsToddlers ?? 0,
    visitorBufferServings: row.visitorBufferServings ?? 0,
    budgetBufferPercentage: row.budgetBufferPercentage ?? 0,
    religion: row.religion ?? 'No Religious Restriction',
    selectedGoals: row.selectedGoals ?? JSON.stringify([row.householdGoal || 'Save Money']),
    planDurationDays: row.planDurationDays ?? 7,
    customFoodRestrictions: row.customFoodRestrictions ?? '[]',
  };
}
