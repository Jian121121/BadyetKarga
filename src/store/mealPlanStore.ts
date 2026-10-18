import { create } from 'zustand';
import {
  addMealPlanEntry,
  getMealPlanForUser,
  getPlanWeekStart,
  removeMealPlanEntry,
  replaceMealPlanForUser,
  replaceMealPlanDaysForUser,
  clearMealPlanForWeek,
  clearMealPlanForUser,
  type MealPlanEntry,
} from '../services/database/mealPlanRepository';
import { getAllDishes, type Dish } from '../services/database/dishRepository';
import { getIngredientsForDishes } from '../services/database/dishIngredientRepository';
import { getPantryItems } from '../services/database/pantryRepository';
import { getFamilyMembers } from '../services/database/familyRepository';
import { getAvailabilityForMembers } from '../services/database/availabilityRepository';
import {
  collectAllergies,
  collectDietaryRestrictions,
  dishContainsAllergen,
  dishViolatesDietaryRestriction,
} from '../algorithms/allergyFilter';
import {
  isDishRestrictedByReligion,
  isMeatDish,
  isMeatlessDay,
  parseCustomFoodRestrictions,
  parseCustomFoodTerms,
  restrictionSourceLabel,
} from '../shared/constants/religion';
import { getMealExceptions } from '../services/database/mealExceptionRepository';
import { parseSelectedGoals } from '../services/database/householdRepository';
import { generateWeeklyPlan, type GeneratePlanResponse } from '../algorithms/weeklyPlanGenerator';
import { useHouseholdStore } from './householdStore';
import { useAuthStore } from './authStore';
import { dateForWeekDay, getWeekStart, WEEK_DAYS } from '../shared/utils/week';
import { ingredientKey } from '../shared/utils/ingredientKey';
import { buildEatersBySlot, eatersCountFromMap, type EaterInfo } from '../shared/utils/eaters';
import { getAppMeta, setAppMeta, META_KEYS } from '../services/database/appMetaRepository';
import { clearGroceryListForUser, getGroceryItems } from '../services/database/groceryRepository';
import { archiveEstimatedWeekSpend } from '../services/database/analyticsRepository';
import { syncMealShoppingReminders } from '../services/notificationScheduler';
import type { FamilyMember } from '../services/database/familyRepository';
import { calculateBudgetBreakdown, visitorServingsForMeal } from '../shared/utils/householdServing';

const viewerId = () => useAuthStore.getState().currentUser?.id ?? -1;

function enrichMembers(members: FamilyMember[]): FamilyMember[] {
  const userAvatar = useAuthStore.getState().currentUser?.avatarUri ?? null;
  if (!userAvatar) return members;
  return members.map((m) =>
    m.relationship === 'Self' && !m.avatarUri ? { ...m, avatarUri: userAvatar } : m
  );
}

/** Rebuild grocery list from the current plan; returns pantry-aware total for Budget Health. */
async function refreshGroceryEstimate(userId: number): Promise<number> {
  const { useGroceryStore } = await import('./groceryStore');
  await useGroceryStore.getState().regenerate(userId);
  return useGroceryStore.getState().items.reduce((s, i) => s + i.estimatedCost, 0);
}

interface MealPlanState {
  dishes: Dish[];
  entries: MealPlanEntry[];
  selectedDay: string;
  selectedMealType: string;
  isGenerating: boolean;
  /** True when a new calendar week started and the old plan was cleared. */
  pendingNewWeekPrompt: boolean;
  currentWeekStart: string;
  planDurationDays: number;
  /** Last pantry-aware grocery estimate from generateWeek (for Budget Health). */
  lastGroceryEstimate: number;
  /** Availability-derived eaters: `${day}|${meal}` → people eating */
  eatersBySlot: Map<string, EaterInfo[]>;

  loadDishes: () => Promise<void>;
  loadEntries: (userId: number) => Promise<void>;
  refreshEaters: (userId: number) => Promise<void>;
  setPlanDurationDays: (days: number) => void;
  ensureCurrentWeek: (userId: number) => Promise<boolean>;
  dismissNewWeekPrompt: (userId: number) => Promise<void>;
  planMeal: (
    userId: number,
    dishId: number,
    dayOfWeek: string,
    mealType: string
  ) => Promise<{ ok: boolean; reason?: string }>;
  removeEntry: (userId: number, entryId: number) => Promise<void>;
  clearWeekPlan: (userId: number) => Promise<void>;
  setSelection: (day: string, mealType: string) => void;
  generateWeek: (userId: number, selectedDays?: string[]) => Promise<GeneratePlanResponse>;
  autoFillDay: (userId: number, day: string) => Promise<void>;
}

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  dishes: [],
  entries: [],
  selectedDay: 'Mon',
  selectedMealType: 'breakfast',
  isGenerating: false,
  pendingNewWeekPrompt: false,
  currentWeekStart: getWeekStart(),
  planDurationDays: 7,
  lastGroceryEstimate: 0,
  eatersBySlot: new Map(),

  loadDishes: async () => set({ dishes: await getAllDishes(viewerId()) }),

  setPlanDurationDays: (days) => set({ planDurationDays: days }),

  refreshEaters: async (userId) => {
    const members = enrichMembers(await getFamilyMembers(userId));
    const rows = await getAvailabilityForMembers(members.map((m) => m.id));
    set({ eatersBySlot: buildEatersBySlot(rows, members) });
  },

  loadEntries: async (userId) => {
    await get().ensureCurrentWeek(userId);
    await get().refreshEaters(userId);
    const prompt = (await getAppMeta(userId, META_KEYS.pendingNewWeekPrompt)) === '1';
    const settings = useHouseholdStore.getState().settings;
    set({
      entries: await getMealPlanForUser(userId),
      pendingNewWeekPrompt: prompt,
      currentWeekStart: getWeekStart(),
      planDurationDays: settings?.planDurationDays ?? 7,
    });
  },

  ensureCurrentWeek: async (userId) => {
    const current = getWeekStart();
    const stored = await getPlanWeekStart(userId);
    set({ currentWeekStart: current });

    if (!stored || stored >= current) {
      const prompt = (await getAppMeta(userId, META_KEYS.pendingNewWeekPrompt)) === '1';
      set({ pendingNewWeekPrompt: prompt });
      return false;
    }

    const lastReset = await getAppMeta(userId, META_KEYS.lastResetWeek);
    if (lastReset === current) {
      set({ pendingNewWeekPrompt: (await getAppMeta(userId, META_KEYS.pendingNewWeekPrompt)) === '1' });
      return false;
    }

    const settings = useHouseholdStore.getState().settings;
    const groceries = await getGroceryItems(userId);
    const groceryTotal = groceries.reduce((s, g) => s + g.estimatedCost, 0);
    await archiveEstimatedWeekSpend(
      userId,
      settings?.weeklyBudget ?? 0,
      groceryTotal,
      stored
    );

    await clearMealPlanForUser(userId);
    await clearGroceryListForUser(userId);
    await setAppMeta(userId, META_KEYS.lastResetWeek, current);
    await setAppMeta(userId, META_KEYS.pendingNewWeekPrompt, '1');

    set({
      entries: [],
      pendingNewWeekPrompt: true,
      currentWeekStart: current,
      lastGroceryEstimate: 0,
    });
    return true;
  },

  dismissNewWeekPrompt: async (userId) => {
    await setAppMeta(userId, META_KEYS.pendingNewWeekPrompt, '0');
    set({ pendingNewWeekPrompt: false });
  },

  planMeal: async (userId, dishId, dayOfWeek, mealType) => {
    const dishes = get().dishes.length > 0 ? get().dishes : await getAllDishes(viewerId());
    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) return { ok: false, reason: 'Dish not found.' };

    const members = await getFamilyMembers(userId);
    const settings = useHouseholdStore.getState().settings;
    const allergies = collectAllergies(members);
    const dietaryRestrictions = collectDietaryRestrictions(members);
    const ings = await getIngredientsForDishes([dishId]);
    const ingNames = ings.map((i) => i.ingredientName);

    if (dishContainsAllergen(dish.name, ingNames, allergies)) {
      return { ok: false, reason: 'This dish conflicts with a family allergy.' };
    }
    if (dishViolatesDietaryRestriction(dish.name, ingNames, dish.tags ?? '', dietaryRestrictions)) {
      return { ok: false, reason: 'This dish conflicts with a family dietary preference.' };
    }

    await get().refreshEaters(userId);
    const slotEaters = get().eatersBySlot.get(`${dayOfWeek}|${mealType.toLowerCase()}`) ?? [];
    if (slotEaters.length === 0) {
      return { ok: false, reason: 'Nobody is available for this meal slot.' };
    }

    const religion = settings?.religion ?? 'No Religious Restriction';
    const exceptions = await getMealExceptions(userId);
    const isExplicitlyAllowed = exceptions.some((e) => e.dishId === dishId && e.allowedForPlan);

    const customFoodRestrictions = parseCustomFoodRestrictions(settings?.customFoodRestrictions);
    const customFoodTerms = parseCustomFoodTerms(settings?.customFoodRestrictions);

    if (
      !isExplicitlyAllowed &&
      isDishRestrictedByReligion(dish.name, dish.category, ingNames, religion, customFoodRestrictions, customFoodTerms)
    ) {
      return {
        ok: false,
        reason: `This dish conflicts with ${restrictionSourceLabel(religion)}. You can add a meal exception in Edit Household if you wish to allow it.`,
      };
    }

    if (
      !isExplicitlyAllowed &&
      isMeatlessDay(religion, dateForWeekDay(getWeekStart(), dayOfWeek)) &&
      isMeatDish(dish.name, dish.category, ingNames)
    ) {
      return {
        ok: false,
        reason: 'This is a meatless Lenten Friday. Choose a fish or vegetable dish, or add a meal exception in Edit Household.',
      };
    }

    await addMealPlanEntry(userId, dishId, dayOfWeek, mealType, getWeekStart());
    set({ entries: await getMealPlanForUser(userId), dishes });
    const groceryTotal = await refreshGroceryEstimate(userId);
    await syncMealShoppingReminders(
      await getMealPlanForUser(userId),
      await getGroceryItems(userId)
    );
    set({ lastGroceryEstimate: groceryTotal });
    return { ok: true };
  },

  removeEntry: async (userId, entryId) => {
    await removeMealPlanEntry(entryId);
    set({ entries: await getMealPlanForUser(userId) });
    const groceryTotal = await refreshGroceryEstimate(userId);
    await syncMealShoppingReminders(
      await getMealPlanForUser(userId),
      await getGroceryItems(userId)
    );
    set({ lastGroceryEstimate: groceryTotal });
  },

  setSelection: (day, mealType) => set({ selectedDay: day, selectedMealType: mealType }),

  clearWeekPlan: async (userId) => {
    const weekStart = getWeekStart();
    await clearMealPlanForWeek(userId, weekStart);
    const { useGroceryStore } = await import('./groceryStore');
    await useGroceryStore.getState().regenerate(userId);
    await syncMealShoppingReminders([], []);
    set({ entries: [], lastGroceryEstimate: 0, pendingNewWeekPrompt: false });
  },

  generateWeek: async (userId, selectedDays) => {
    set({ isGenerating: true });
    try {
      const settings = useHouseholdStore.getState().settings;
      const [dishes, pantry, rawMembers, mealExceptions] = await Promise.all([
        getAllDishes(viewerId()),
        getPantryItems(userId),
        getFamilyMembers(userId),
        getMealExceptions(userId),
      ]);
      const members = enrichMembers(rawMembers);

      const availability = await getAvailabilityForMembers(members.map((m) => m.id));
      const eatersBySlot = buildEatersBySlot(availability, members);
      const eatersCounts = eatersCountFromMap(eatersBySlot);

      const allIngredients = await getIngredientsForDishes(dishes.map((d) => d.id));
      const ingredientsByDishId = new Map<number, typeof allIngredients>();
      for (const ing of allIngredients) {
        const list = ingredientsByDishId.get(ing.dishId) ?? [];
        list.push(ing);
        ingredientsByDishId.set(ing.dishId, list);
      }

      let mealStyles: string[] = [];
      try {
        mealStyles = settings?.mealStyles ? JSON.parse(settings.mealStyles) : [];
      } catch {
        mealStyles = [];
      }

      const favoriteFoods = members
        .flatMap((m) => (m.favoriteFoods ?? '').split(','))
        .map((f) => f.trim())
        .filter(Boolean);

      const selectedGoals = parseSelectedGoals(settings);
      const planDurationDays = get().planDurationDays || settings?.planDurationDays || 7;

      const result = generateWeeklyPlan({
        dishes,
        ingredientsByDishId,
        weeklyBudget: settings?.weeklyBudget ?? 0,
        budgetBufferPercentage: settings?.budgetBufferPercentage ?? 0,
        selectedGoals,
        householdComposition: {
          adults: settings?.adults ?? 1,
          children: settings?.children ?? 0,
          seniors: settings?.seniors ?? 0,
          infantsToddlers: settings?.infantsToddlers ?? 0,
          totalMembers: settings?.totalMembers ?? members.length ?? 1,
        },
        familyMembers: members,
        visitorBufferServings: settings?.visitorBufferServings ?? 0,
        religion: settings?.religion ?? 'No Religious Restriction',
        customFoodRestrictions: parseCustomFoodRestrictions(settings?.customFoodRestrictions),
        customFoodTerms: parseCustomFoodTerms(settings?.customFoodRestrictions),
        weekStartDate: getWeekStart(),
        mealExceptions: mealExceptions.map((e) => ({
          dishId: e.dishId,
          dishName: e.dishName,
          allowedForPlan: e.allowedForPlan,
          reason: e.reason,
        })),
        planDurationDays,
        selectedDays,
        pantryItems: pantry.map((p) => p.ingredientName),
        allergies: collectAllergies(members),
        dietaryRestrictions: collectDietaryRestrictions(members),
        mealStyles,
        preferredCookTime: settings?.preferredCookTime ?? null,
        cookFrequency: settings?.cookFrequency ?? null,
        favoriteFoods,
        eatersBySlot: eatersCounts,
      });

      const weekStart = getWeekStart();
      const generatedEntries = result.entries.map(({ dishId, dayOfWeek, mealType }) => ({
        dishId,
        dayOfWeek,
        mealType,
      }));
      if (selectedDays?.length) {
        await replaceMealPlanDaysForUser(userId, selectedDays, generatedEntries, weekStart);
      } else {
        await replaceMealPlanForUser(userId, generatedEntries, weekStart);
      }
      await setAppMeta(userId, META_KEYS.pendingNewWeekPrompt, '0');
      await setAppMeta(userId, META_KEYS.lastResetWeek, weekStart);

      // Keep grocery list aligned with the new plan so Budget Health matches household budget.
      const { useGroceryStore } = await import('./groceryStore');
      await useGroceryStore.getState().regenerate(userId);
      const groceryTotal = useGroceryStore
        .getState()
        .items.reduce((s, i) => s + i.estimatedCost, 0);
      const latestEntries = await getMealPlanForUser(userId);
      await syncMealShoppingReminders(latestEntries, await getGroceryItems(userId));

      set({
        dishes,
        entries: latestEntries,
        pendingNewWeekPrompt: false,
        currentWeekStart: weekStart,
        lastGroceryEstimate: groceryTotal || result.estimatedGroceryCost,
        eatersBySlot,
      });
      return { ...result, estimatedGroceryCost: groceryTotal || result.estimatedGroceryCost };
    } finally {
      set({ isGenerating: false });
    }
  },

  autoFillDay: async (userId, day) => {
    const { entries, generateWeek } = get();
    const settings = useHouseholdStore.getState().settings;
    const openSlots = ['breakfast', 'lunch', 'snack', 'dinner'].filter(
      (meal) => !entries.some((e) => e.dayOfWeek === day && e.mealType === meal)
    );
    if (openSlots.length === 0) return;

    if (entries.length === 0) {
      await generateWeek(userId);
      return;
    }

    // Allergy-safe fill from library, preferring dishes already in the week (reuse).
    const { usableBudget } = calculateBudgetBreakdown(
      settings?.weeklyBudget ?? 0,
      settings?.budgetBufferPercentage ?? 0
    );
    const dishes = await getAllDishes(viewerId());
    const members = await getFamilyMembers(userId);
    const allergies = collectAllergies(members);
    const dietaryRestrictions = collectDietaryRestrictions(members);
    const pantry = await getPantryItems(userId);
    const pantrySet = new Set(pantry.map((p) => ingredientKey(p.ingredientName)));
    const mealExceptions = await getMealExceptions(userId);
    const religion = settings?.religion ?? 'No Religious Restriction';
    const customFoodRestrictions = parseCustomFoodRestrictions(settings?.customFoodRestrictions);
    const customFoodTerms = parseCustomFoodTerms(settings?.customFoodRestrictions);
    const meatless = isMeatlessDay(religion, dateForWeekDay(getWeekStart(), day));
    await get().refreshEaters(userId);
    const eatersBySlot = get().eatersBySlot;

    const allIngredients = await getIngredientsForDishes(dishes.map((d) => d.id));
    const byDish = new Map<number, typeof allIngredients>();
    for (const ing of allIngredients) {
      const list = byDish.get(ing.dishId) ?? [];
      list.push(ing);
      byDish.set(ing.dishId, list);
    }

    const safe = dishes.filter((d) => {
      const names = (byDish.get(d.id) ?? []).map((i) => i.ingredientName);
      const explicitlyAllowed = mealExceptions.some((e) => e.dishId === d.id && e.allowedForPlan);
      return (
        !dishContainsAllergen(d.name, names, allergies) &&
        !dishViolatesDietaryRestriction(d.name, names, d.tags ?? '', dietaryRestrictions) &&
        (explicitlyAllowed ||
          (!isDishRestrictedByReligion(d.name, d.category, names, religion, customFoodRestrictions, customFoodTerms) &&
            !(meatless && isMeatDish(d.name, d.category, names))))
      );
    });

    const plannedIds = new Set(entries.map((e) => e.dishId));
    const { useGroceryStore } = await import('./groceryStore');
    await useGroceryStore.getState().regenerate(userId);
    let runningCost = useGroceryStore
      .getState()
      .items.reduce((sum, item) => sum + item.estimatedCost, 0);
    const purchasedIngredients = new Set(
      useGroceryStore.getState().items.map((item) => ingredientKey(item.ingredientName))
    );
    const visitorBuffer = settings?.visitorBufferServings ?? 0;

    for (const meal of openSlots) {
      const eaters = (eatersBySlot.get(`${day}|${meal}`) ?? []).length;
      if (eaters <= 0) continue;

      const pool = safe
        .filter((d) =>
          d.mealTypes
            .split(',')
            .map((m) => m.trim().toLowerCase())
            .includes(meal)
        )
        .sort((a, b) => {
          const aReuse = plannedIds.has(a.id) ? 0 : 1;
          const bReuse = plannedIds.has(b.id) ? 0 : 1;
          if (aReuse !== bReuse) return aReuse - bReuse;
          const aFit = (a.servings || 4) >= eaters ? 0 : 1;
          const bFit = (b.servings || 4) >= eaters ? 0 : 1;
          if (aFit !== bFit) return aFit - bFit;
          return a.estimatedCost - b.estimatedCost;
        });

      for (const dish of pool) {
        const recipeServings = dish.servings || 4;
        const scale = (eaters + visitorServingsForMeal(meal, visitorBuffer)) / recipeServings;
        const candidateCost = (byDish.get(dish.id) ?? []).reduce((sum, ingredient) => {
          const key = ingredientKey(ingredient.ingredientName);
          if (pantrySet.has(key) || purchasedIngredients.has(key)) return sum;
          return sum + ingredient.estimatedPrice * scale;
        }, 0);
        if (usableBudget > 0 && runningCost + candidateCost > usableBudget) continue;
        await addMealPlanEntry(userId, dish.id, day, meal, getWeekStart());
        plannedIds.add(dish.id);
        runningCost += candidateCost;
        for (const ingredient of byDish.get(dish.id) ?? []) {
          purchasedIngredients.add(ingredientKey(ingredient.ingredientName));
        }
        break;
      }
    }

    set({ entries: await getMealPlanForUser(userId), dishes });
  },
}));
