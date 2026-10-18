import { create } from 'zustand';
import {
  addFamilyMember,
  getFamilyMembers,
  deleteFamilyMember,
  updateFamilyMember,
  type FamilyMember,
  type FamilyMemberExtras,
} from '../services/database/familyRepository';
import { setAvailability } from '../services/database/availabilityRepository';
import { WEEK_DAYS, WEEK_MEALS } from '../shared/utils/week';
import { useHouseholdStore } from './householdStore';

export type DayAvailability = Record<(typeof WEEK_MEALS)[number], boolean>;
export type MemberAvailability = Record<(typeof WEEK_DAYS)[number], DayAvailability>;

export function defaultAvailability(): MemberAvailability {
  const result = {} as MemberAvailability;
  for (const day of WEEK_DAYS) {
    result[day] = { breakfast: true, lunch: true, snack: true, dinner: true };
  }
  return result;
}

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;

  loadMembers: (userId: number) => Promise<void>;
  addMember: (
    userId: number,
    name: string,
    allergies: string,
    dietaryRestrictions: string,
    extras?: FamilyMemberExtras,
    availability?: MemberAvailability
  ) => Promise<FamilyMember>;
  updateMember: (
    id: number,
    userId: number,
    patch: {
      name?: string;
      allergies?: string;
      dietaryRestrictions?: string;
      relationship?: string;
      age?: string;
      gender?: string;
      favoriteFoods?: string;
      avatarUri?: string | null;
    }
  ) => Promise<void>;
  removeMember: (id: number, userId: number) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  isLoading: false,

  loadMembers: async (userId) => {
    set({ isLoading: true });
    const members = await getFamilyMembers(userId);
    set({ members, isLoading: false });
  },

  addMember: async (userId, name, allergies, dietaryRestrictions, extras, availability) => {
    const saved = await addFamilyMember(userId, name, allergies, dietaryRestrictions, extras);
    const grid = availability ?? defaultAvailability();
    for (const day of WEEK_DAYS) {
      const slot = grid[day];
      await setAvailability(saved.id, day, slot.breakfast, slot.lunch, slot.snack, slot.dinner);
    }
    const members = await getFamilyMembers(userId);
    set({ members });
    await useHouseholdStore.getState().syncCompositionFromMembers(userId);
    // Keep Weekly Planner eaters in sync immediately (no regenerate needed).
    const { useMealPlanStore } = await import('./mealPlanStore');
    await useMealPlanStore.getState().refreshEaters(userId);
    if (useMealPlanStore.getState().entries.length > 0) {
      await useMealPlanStore.getState().generateWeek(userId);
    }
    return saved;
  },

  updateMember: async (id, userId, patch) => {
    await updateFamilyMember(userId, id, patch);
    const members = await getFamilyMembers(userId);
    set({ members });
    await useHouseholdStore.getState().syncCompositionFromMembers(userId);
    const { useMealPlanStore } = await import('./mealPlanStore');
    await useMealPlanStore.getState().refreshEaters(userId);
    if (useMealPlanStore.getState().entries.length > 0) {
      await useMealPlanStore.getState().generateWeek(userId);
    }
  },

  removeMember: async (id, userId) => {
    await deleteFamilyMember(userId, id);
    const members = await getFamilyMembers(userId);
    set({ members });
    await useHouseholdStore.getState().syncCompositionFromMembers(userId);
    const { useMealPlanStore } = await import('./mealPlanStore');
    await useMealPlanStore.getState().refreshEaters(userId);
    if (useMealPlanStore.getState().entries.length > 0) {
      await useMealPlanStore.getState().generateWeek(userId);
    }
  },
}));
