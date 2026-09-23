import { create } from 'zustand';
import { addFamilyMember } from '../services/database/familyRepository';
import { setAvailability } from '../services/database/availabilityRepository';
import { addPantryItem } from '../services/database/pantryRepository';
import { useHouseholdStore } from './householdStore';
import { useAuthStore } from './authStore';
import { useFamilyStore } from './familyStore';
import { compositionFromMembers, recommendBudgetBufferPercentage } from '../shared/utils/householdServing';

// ── Shared wizard constants ─────────────────────────────────

export const WIZARD_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type WizardDay = (typeof WIZARD_DAYS)[number];

export const WIZARD_MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type WizardMeal = (typeof WIZARD_MEALS)[number];

export type DayAvailability = Record<WizardMeal, boolean>;
export type MemberAvailability = Record<WizardDay, DayAvailability>;

export interface DraftMember {
  localId: string;
  name: string;
  relationship: string;
  age: string;
  gender: string;
  favoriteFoods: string;
  allergies: string[];
  dietaryRestrictions: string[];
  availability: MemberAvailability;
  isOwner: boolean;
  avatarUri?: string | null;
}

function defaultAvailability(): MemberAvailability {
  const result = {} as MemberAvailability;
  for (const day of WIZARD_DAYS) {
    result[day] = { breakfast: true, lunch: true, snack: true, dinner: true };
  }
  return result;
}

let localIdCounter = 0;
function nextLocalId(): string {
  return `draft-${++localIdCounter}-${Date.now()}`;
}

export function createDraftMember(partial: Partial<DraftMember> = {}): DraftMember {
  return {
    localId: nextLocalId(),
    name: '',
    relationship: '',
    age: '',
    gender: '',
    favoriteFoods: '',
    allergies: [],
    dietaryRestrictions: [],
    availability: defaultAvailability(),
    isOwner: false,
    ...partial,
  };
}

// ── Store ───────────────────────────────────────────────────

interface SetupWizardState {
  // Step 2 — Household details
  householdName: string;
  weeklyBudget: string; // raw text input, parsed on commit
  plannedFamilyCount: number;
  adults: number;
  children: number;
  seniors: number;
  infantsToddlers: number;
  visitorBufferServings: number;
  budgetBufferPercentage: number;
  religion: string;
  planDurationDays: number;
  currency: string;

  // Step 3 — Multi-Goals
  goal: string | null; // backward compatibility
  selectedGoals: string[];

  // Steps 4-6 — Family members (incl. allergies + availability)
  members: DraftMember[];

  // Step 7 — Pantry
  pantryItems: string[];

  // Step 8 — Cooking preferences
  cookFrequency: string | null;
  preferredCookTime: string | null;
  mealStyles: string[];

  isCommitting: boolean;
  commitError: string | null;

  // Actions
  setHouseholdName: (name: string) => void;
  setWeeklyBudget: (budget: string) => void;
  setPlannedFamilyCount: (count: number) => void;
  setAdults: (count: number) => void;
  setChildren: (count: number) => void;
  setSeniors: (count: number) => void;
  setInfantsToddlers: (count: number) => void;
  setVisitorBufferServings: (servings: number) => void;
  setBudgetBufferPercentage: (pct: number) => void;
  setReligion: (religion: string) => void;
  setPlanDurationDays: (days: number) => void;
  setGoal: (goal: string) => void;
  toggleGoal: (goal: string) => void;
  setSelectedGoals: (goals: string[]) => void;

  /** Makes sure the account owner is the first draft member ("Self"). */
  ensureOwner: (ownerName: string) => void;
  addMember: (member: DraftMember) => void;
  updateMember: (localId: string, patch: Partial<DraftMember>) => void;
  removeMember: (localId: string) => void;
  toggleMemberAllergy: (localId: string, allergy: string) => void;
  toggleMemberDiet: (localId: string, diet: string) => void;
  setMemberAvailability: (localId: string, day: WizardDay, meal: WizardMeal, value: boolean) => void;
  copyAvailabilityFromOwner: (localId: string) => void;

  togglePantryItem: (ingredient: string) => void;

  setCookFrequency: (value: string) => void;
  setPreferredCookTime: (value: string) => void;
  toggleMealStyle: (style: string) => void;

  reset: () => void;

  /** Persists the whole draft to the repositories, then saves household settings (which flips the app out of the wizard). */
  commitWizard: (userId: number) => Promise<boolean>;
}

const initialDraft = {
  householdName: '',
  weeklyBudget: '',
  plannedFamilyCount: 1,
  adults: 1,
  children: 0,
  seniors: 0,
  infantsToddlers: 0,
  visitorBufferServings: 0,
  budgetBufferPercentage: 0,
  religion: 'No Religious Restriction',
  planDurationDays: 7,
  currency: 'PHP',
  goal: 'Save Money',
  selectedGoals: ['Save Money'],
  members: [] as DraftMember[],
  pantryItems: [] as string[],
  cookFrequency: null as string | null,
  preferredCookTime: null as string | null,
  mealStyles: [] as string[],
  isCommitting: false,
  commitError: null as string | null,
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export const useSetupWizardStore = create<SetupWizardState>((set, get) => ({
  ...initialDraft,

  setHouseholdName: (householdName) => set({ householdName }),
  setWeeklyBudget: (weeklyBudget) => set({ weeklyBudget }),
  setPlannedFamilyCount: (plannedFamilyCount) =>
    set({ plannedFamilyCount: Math.max(1, plannedFamilyCount) }),
  setAdults: (adults) => set({ adults: Math.max(0, adults) }),
  setChildren: (children) => set({ children: Math.max(0, children) }),
  setSeniors: (seniors) => set({ seniors: Math.max(0, seniors) }),
  setInfantsToddlers: (infantsToddlers) => set({ infantsToddlers: Math.max(0, infantsToddlers) }),
  setVisitorBufferServings: (visitorBufferServings) =>
    set({ visitorBufferServings: Math.max(0, visitorBufferServings) }),
  setBudgetBufferPercentage: (budgetBufferPercentage) =>
    set({ budgetBufferPercentage: Math.max(0, budgetBufferPercentage) }),
  setReligion: (religion) => set({ religion }),
  setPlanDurationDays: (planDurationDays) => set({ planDurationDays }),
  setGoal: (goal) => set({ goal, selectedGoals: [goal] }),
  toggleGoal: (goal) => {
    const current = get().selectedGoals;
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    set({
      selectedGoals: updated.length > 0 ? updated : ['Save Money'],
      goal: updated[0] ?? 'Save Money',
    });
  },
  setSelectedGoals: (selectedGoals) =>
    set({
      selectedGoals: selectedGoals.length > 0 ? selectedGoals : ['Save Money'],
      goal: selectedGoals[0] ?? 'Save Money',
    }),

  ensureOwner: (ownerName) => {
    const { members } = get();
    if (members.some((m) => m.isOwner)) return;
    const owner = createDraftMember({
      name: ownerName,
      relationship: 'Self',
      isOwner: true,
    });
    set({ members: [owner, ...members] });
  },

  addMember: (member) => set({ members: [...get().members, member] }),

  updateMember: (localId, patch) =>
    set({
      members: get().members.map((m) => (m.localId === localId ? { ...m, ...patch } : m)),
    }),

  removeMember: (localId) =>
    set({ members: get().members.filter((m) => m.localId !== localId) }),

  toggleMemberAllergy: (localId, allergy) =>
    set({
      members: get().members.map((m) =>
        m.localId === localId ? { ...m, allergies: toggleInList(m.allergies, allergy) } : m
      ),
    }),

  toggleMemberDiet: (localId, diet) =>
    set({
      members: get().members.map((m) =>
        m.localId === localId
          ? { ...m, dietaryRestrictions: toggleInList(m.dietaryRestrictions, diet) }
          : m
      ),
    }),

  setMemberAvailability: (localId, day, meal, value) =>
    set({
      members: get().members.map((m) =>
        m.localId === localId
          ? {
              ...m,
              availability: {
                ...m.availability,
                [day]: { ...m.availability[day], [meal]: value },
              },
            }
          : m
      ),
    }),

  copyAvailabilityFromOwner: (localId) => {
    const owner = get().members.find((m) => m.isOwner);
    if (!owner) return;
    const copied = {} as MemberAvailability;
    for (const day of WIZARD_DAYS) {
      copied[day] = { ...owner.availability[day] };
    }
    get().updateMember(localId, { availability: copied });
  },

  togglePantryItem: (ingredient) =>
    set({ pantryItems: toggleInList(get().pantryItems, ingredient) }),

  setCookFrequency: (cookFrequency) => set({ cookFrequency }),
  setPreferredCookTime: (preferredCookTime) => set({ preferredCookTime }),
  toggleMealStyle: (style) => set({ mealStyles: toggleInList(get().mealStyles, style) }),

  reset: () => set({ ...initialDraft }),

  commitWizard: async (userId) => {
    const state = get();
    set({ isCommitting: true, commitError: null });

    try {
      // 1. Build the final member list — owner ("Self") always goes first.
      const ownerName = useAuthStore.getState().currentUser?.fullName ?? 'Me';
      const members = [...state.members];
      if (!members.some((m) => m.isOwner || m.relationship === 'Self')) {
        members.unshift(createDraftMember({ name: ownerName, relationship: 'Self', isOwner: true }));
      }

      // 2. Persist each member, then their weekly availability.
      for (const member of members) {
        const saved = await addFamilyMember(
          userId,
          member.name.trim() || 'Unnamed',
          member.allergies.join(','),
          member.dietaryRestrictions.join(','),
          {
            relationship: member.relationship,
            age: member.age,
            gender: member.gender,
            favoriteFoods: member.favoriteFoods,
            avatarUri:
              member.avatarUri ??
              (member.isOwner || member.relationship === 'Self'
                ? useAuthStore.getState().currentUser?.avatarUri ?? null
                : null),
          }
        );
        for (const day of WIZARD_DAYS) {
          const slot = member.availability[day];
          await setAvailability(saved.id, day, slot.breakfast, slot.lunch, slot.snack, slot.dinner);
        }
      }

      // 3. Pantry items — everything selected is simply "on hand".
      for (const ingredient of state.pantryItems) {
        await addPantryItem(userId, ingredient, 'on hand');
      }

      const composition = compositionFromMembers(members);
      const totalMembers = composition.totalMembers || 1;

      // 4. Household settings LAST — saveSettings updates the store,
      //    which makes RootNavigator switch from the wizard to MainTabs.
      await useHouseholdStore.getState().saveSettings({
        userId,
        householdName: state.householdName.trim() || 'My Household',
        weeklyBudget: parseFloat(state.weeklyBudget) || 0,
        householdGoal: state.selectedGoals[0] ?? state.goal ?? 'Save Money',
        currency: state.currency,
        cookFrequency: state.cookFrequency ?? '',
        preferredCookTime: state.preferredCookTime ?? '',
        mealStyles: JSON.stringify(state.mealStyles),
        totalMembers,
        adults: composition.adults,
        children: composition.children,
        seniors: composition.seniors,
        infantsToddlers: composition.infantsToddlers,
        visitorBufferServings: state.visitorBufferServings,
        budgetBufferPercentage: recommendBudgetBufferPercentage({
          weeklyBudget: parseFloat(state.weeklyBudget) || 0,
          goals: state.selectedGoals,
          mealStyles: state.mealStyles,
        }),
        religion: state.religion,
        selectedGoals: JSON.stringify(state.selectedGoals),
        planDurationDays: state.planDurationDays,
      });

      // Refresh family store so MainTabs screens see the new members immediately.
      await useFamilyStore.getState().loadMembers(userId);
      const { useMealPlanStore } = await import('./mealPlanStore');
      await useMealPlanStore.getState().refreshEaters(userId);

      set({ ...initialDraft });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your setup.';
      set({ isCommitting: false, commitError: message });
      return false;
    }
  },
}));
