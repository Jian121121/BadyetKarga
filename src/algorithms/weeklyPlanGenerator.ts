/**
 * Weekly Meal Plan Generator — BadyetKarga's Multi-Goal Recommendation Engine.
 *
 * Discovers and optimizes the best meal plan balancing:
 * - Multiple simultaneous user goals (Save Money, Healthy, Variety, Waste Reduction, etc.)
 * - Usable planning budget (strictly protecting reserved buffer)
 * - Household composition (Adults, Children, Seniors, Infants) + Visitor buffer on lunch/dinner
 * - Religion / custom food-avoid preferences with specific meal exception overrides
 * - Roman Catholic meatless Lent Fridays
 * - Plan durations (1, 3, 5, or 7 days)
 * - Complete ingredient expansion and reuse
 */

import type { Dish } from '../services/database/dishRepository';
import type { DishIngredient } from '../services/database/dishIngredientRepository';
import { dishContainsAllergen, dishViolatesDietaryRestriction } from './allergyFilter';
import {
  isDishRestrictedByReligion,
  isMeatDish,
  isMeatlessDay,
  type FoodRestrictionKey,
} from '../shared/constants/religion';
import { normalizeGoalKey } from '../shared/constants/householdGoals';
import {
  calculateEffectiveServings,
  calculateBudgetBreakdown,
  getRecipeScaleFactor,
  compositionFromMembers,
  visitorServingsForMeal,
  type HouseholdComposition,
  type HouseholdMemberProfile,
} from '../shared/utils/householdServing';
import { dateForWeekDay, getPlanDays } from '../shared/utils/week';
import { ingredientKey } from '../shared/utils/ingredientKey';

export const PLAN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const PLAN_MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;

export interface MealExceptionParam {
  dishId: number;
  dishName: string;
  allowedForPlan: boolean;
  reason?: string;
}

export interface GeneratePlanRequest {
  dishes: Dish[];
  ingredientsByDishId: Map<number, DishIngredient[]>;
  weeklyBudget: number;
  /** Reserved buffer percentage (e.g. 10 for 10%) */
  budgetBufferPercentage?: number;
  /** Selected goals (e.g. ["Save Money", "Eat Healthier", "Minimize Food Waste"]) */
  selectedGoals?: string[];
  /** Household demographic composition */
  householdComposition?: Partial<HouseholdComposition>;
  /** Existing family-member records; preferred over legacy composition fields. */
  familyMembers?: HouseholdMemberProfile[];
  /** Extra servings for unexpected guests, added to lunch and dinner only */
  visitorBufferServings?: number;
  /** Household religion/dietary configuration */
  religion?: string;
  /** Foods to avoid when religion is "Other" or "Custom" */
  customFoodRestrictions?: FoodRestrictionKey[];
  /** Free-typed foods to avoid (same religions as above) */
  customFoodTerms?: string[];
  /** Monday of the planned week (YYYY-MM-DD); enables date rules such as Lent Fridays. */
  weekStartDate?: string;
  /** Specific meal exceptions that override default religion restrictions */
  mealExceptions?: MealExceptionParam[];
  /** Plan duration in days: 1, 3, 5, or 7 */
  planDurationDays?: number;
  /** Explicit days selected for this generation run. */
  selectedDays?: string[];
  /** Ingredient names already at home (from pantry). */
  pantryItems: string[];
  /** Family allergens (already tokenized). */
  allergies: string[];
  dietaryRestrictions?: string[];
  /** Wizard meal styles, e.g. ["Budget Friendly", "Quick Meals"]. */
  mealStyles?: string[];
  /** Preferred cook time, e.g. "30 minutes". */
  preferredCookTime?: string | null;
  /** Cook frequency, e.g. "Weekdays". */
  cookFrequency?: string | null;
  /** Family favorite foods (free text list). */
  favoriteFoods?: string[];
  /** Include snack slots when budget allows. Defaults to true. */
  includeSnacks?: boolean;
  /** Map of `${day}|${meal}` → number of people eating */
  eatersBySlot?: Map<string, number>;
}

export interface PlannedSlot {
  dishId: number;
  dishName: string;
  dayOfWeek: string;
  mealType: string;
  eaters?: number;
  servings?: number;
}

export interface GeneratePlanResponse {
  entries: PlannedSlot[];
  /** Incremental grocery cost of the plan (pantry + reuse deducted). */
  estimatedGroceryCost: number;
  /** How many dishes were excluded because of family allergies. */
  excludedByAllergy: number;
  /** How many dishes were excluded because of religion/dietary restrictions. */
  excludedByReligion: number;
  /** Slots skipped because nobody is available. */
  skippedByAvailability: number;
  totalBudget: number;
  reservedBuffer: number;
  usableBudget: number;
  withinBudget: boolean;
  activeGoals: string[];
  durationDays: number;
}

function cookTimeCapMinutes(preference?: string | null): number | null {
  if (!preference) return null;
  if (preference.includes('15')) return 20;
  if (preference.includes('30')) return 40;
  if (preference.includes('1 hour')) return 70;
  return null;
}

/**
 * Multi-Goal Weighted Scoring Algorithm
 * Scores a dish based on all active goals, household composition, time, and ingredient reuse.
 */
function scoreDishMultiGoal(
  dish: Dish,
  ingredients: DishIngredient[],
  pantry: Set<string>,
  alreadyBought: Set<string>,
  activeGoalKeys: Set<string>,
  mealStyles: string[],
  favoriteFoods: string[],
  cookTimeCap: number | null,
  targetCapacity: number,
  categoryUsage: Map<string, number>,
  dishUsageCount: number
): number {
  let score = 10; // Baseline score

  const dishTags = dish.tags ? dish.tags.split(',').map((t) => t.trim().toLowerCase()) : [];
  const dishCategory = dish.category.toLowerCase();
  const nameLower = dish.name.toLowerCase();

  // 1. Wizard Meal Styles & Favorite Foods
  for (const style of mealStyles) {
    if (dishTags.includes(style.trim().toLowerCase())) score += 3;
  }
  for (const fav of favoriteFoods) {
    const token = fav.trim().toLowerCase();
    if (token && nameLower.includes(token)) score += 4;
  }

  // 2. Prep time matching
  if (cookTimeCap !== null && dish.prepTimeMinutes <= cookTimeCap) {
    score += 3;
  }

  // 3. Household Suitability & Capacity (people eating this slot + visitor buffer)
  const servings = dish.servings || 4;
  const capacityDiff = Math.abs(servings - targetCapacity);
  if (capacityDiff <= 1) {
    score += 5; // Near exact fit for the household
  } else if (servings >= targetCapacity) {
    score += 3; // Adequately feeds the household with possible leftovers
  } else {
    score += Math.max(0, 2 - capacityDiff * 0.5);
  }

  // 4. Pantry & Shared Ingredient Reuse (Food Waste & Budget)
  let ownedCount = 0;
  let sharedBoughtCount = 0;
  for (const ing of ingredients) {
    const key = ingredientKey(ing.ingredientName);
    if (pantry.has(key)) ownedCount++;
    else if (alreadyBought.has(key)) sharedBoughtCount++;
  }
  const totalIngs = Math.max(1, ingredients.length);
  const newIngredientCount = Math.max(0, ingredients.length - ownedCount - sharedBoughtCount);

  // Pantry presence gives immediate cost savings
  score += (ownedCount / totalIngs) * 4;

  // 5. Goal-Specific Weighted Boosts
  // GOAL: Save Money
  if (activeGoalKeys.has('save_money')) {
    // Reward lower absolute cost and high cost-efficiency
    const costPerServing = dish.estimatedCost / Math.max(1, servings);
    if (costPerServing < 60) score += 6;
    else if (costPerServing < 90) score += 4;
    else if (costPerServing < 130) score += 2;
    else score -= 2;

    // Favor dishes where ingredients are already in the house
    score += (ownedCount / totalIngs) * 4;
  }

  // GOAL: Eat Healthier
  if (activeGoalKeys.has('healthy')) {
    if (dishTags.includes('healthy')) score += 6;
    if (dishCategory === 'vegetables' || dishCategory === 'fish & seafood') score += 4;
    if (dish.prepTimeMinutes > 0 && (dishCategory === 'chicken' || dishCategory === 'soup')) score += 2;
    if (/fried|prito|crispy|lechon|chicharon|tocino|longganisa|corned|hotdog|spam|liver spread/.test(nameLower)) {
      score -= 4;
    }
    if (/sinigang|tinola|nilaga|ginisang|pinakbet|laswa|utan|steamed|inihaw|paksiw/.test(nameLower)) score += 2;
  }

  // GOAL: High Protein
  if (activeGoalKeys.has('high_protein')) {
    if (
      dishCategory === 'chicken' ||
      dishCategory === 'pork' ||
      dishCategory === 'beef' ||
      dishCategory === 'fish & seafood'
    ) {
      score += 5;
    }
    if (ingredients.some((i) => /egg|tofu|beans|monggo|meat|chicken|pork|beef|fish/.test(i.ingredientName.toLowerCase()))) {
      score += 3;
    }
  }

  // GOAL: More Vegetables
  if (activeGoalKeys.has('more_vegetables')) {
    if (dishCategory === 'vegetables') score += 7;
    const vegCount = ingredients.filter((i) =>
      /kangkong|sitaw|talong|ampalaya|okra|squash|papaya|malunggay|cabbage|carrots|pechay|togue|cauliflower/.test(
        i.ingredientName.toLowerCase()
      )
    ).length;
    score += Math.min(6, vegCount * 2);
  }

  // GOAL: Family Friendly
  if (activeGoalKeys.has('family_friendly')) {
    if (dishTags.includes('family favorite') || dishTags.includes('traditional filipino')) score += 5;
    if (/adobo|sinigang|tinola|menudo|pancit|caldereta|arroz caldo|champorado/.test(nameLower)) score += 4;
  }

  // GOAL: Quick & Easy Meals
  if (activeGoalKeys.has('quick_meals')) {
    if (dish.prepTimeMinutes <= 20) score += 7;
    else if (dish.prepTimeMinutes <= 30) score += 4;
    else if (dish.prepTimeMinutes > 45) score -= 3;
  }

  // GOAL: Minimize Food Waste
  if (activeGoalKeys.has('minimize_food_waste')) {
    // Use up what is already at home before it spoils
    score += (ownedCount / totalIngs) * 6;
    // Reuse ingredients bought for earlier meals so partial packs get finished
    if (sharedBoughtCount > 0) score += Math.min(8, sharedBoughtCount * 2.5);
    // Each brand-new ingredient risks a leftover half-pack
    score -= Math.max(0, newIngredientCount - 3) * 1.5;
  }

  // GOAL: Minimize Grocery Trips
  if (activeGoalKeys.has('minimize_grocery_trips')) {
    // A smaller, overlapping shopping list fits in one trip
    score += (ownedCount / totalIngs) * 5;
    if (sharedBoughtCount > 0) score += Math.min(8, sharedBoughtCount * 2);
    score -= newIngredientCount * 1;
    // Long-keeping staples (canned, dried, eggs) don't force a mid-week fresh-market run
    if (ingredients.some((i) => /canned|sardin|corned|tuyo|dilis|daing|monggo|egg|noodle|pancit|rice/.test(i.ingredientName.toLowerCase()))) {
      score += 2;
    }
  }

  // GOAL: Maximize Food Quantity
  if (activeGoalKeys.has('maximize_food_quantity')) {
    if (servings >= 5) score += 6;
    else if (servings >= 4) score += 3;
    if (/monggo|pancit|sinigang|tinola|caldereta|bulalo|arroz caldo/.test(nameLower)) score += 3;
  }

  // GOAL: Meal Variety & Category Balance
  if (activeGoalKeys.has('meal_variety')) {
    // Penalize repeating the exact same dish heavily
    if (dishUsageCount > 0) score -= 8 * dishUsageCount;

    // Penalize over-concentrating in one category (e.g. 4 pork meals in a row)
    const catCount = categoryUsage.get(dish.category) ?? 0;
    if (catCount === 0) score += 4; // Fresh category bonus
    else if (catCount >= 2) score -= catCount * 2.5;
  } else {
    // Standard light variety penalty
    if (dishUsageCount > 0) score -= 3 * dishUsageCount;
  }

  return score;
}

/**
 * Incremental cost of cooking this dish given what is in the pantry and what has already been bought.
 */
function calculateIncrementalCost(
  ingredients: DishIngredient[],
  pantry: Set<string>,
  alreadyBought: Set<string>,
  scale = 1
): { cost: number; newItems: string[] } {
  let cost = 0;
  const newItems: string[] = [];
  for (const ing of ingredients) {
    const key = ingredientKey(ing.ingredientName);
    if (pantry.has(key) || alreadyBought.has(key)) continue;
    cost += ing.estimatedPrice * scale;
    newItems.push(key);
  }
  return { cost, newItems };
}

export function generateWeeklyPlan(request: GeneratePlanRequest): GeneratePlanResponse {
  const {
    dishes,
    ingredientsByDishId,
    weeklyBudget,
    budgetBufferPercentage = 0,
    selectedGoals = [],
    householdComposition = { adults: 1, children: 0, seniors: 0, infantsToddlers: 0 },
    familyMembers = [],
    visitorBufferServings = 0,
    religion = 'No Religious Restriction',
    customFoodRestrictions = [],
    customFoodTerms = [],
    weekStartDate,
    mealExceptions = [],
    planDurationDays = 7,
    selectedDays,
    pantryItems = [],
    allergies = [],
    dietaryRestrictions = [],
    mealStyles = [],
    preferredCookTime = null,
    cookFrequency = null,
    favoriteFoods = [],
    includeSnacks = true,
    eatersBySlot,
  } = request;

  // 1. Budget buffer calculations
  const { reservedBuffer, usableBudget } = calculateBudgetBreakdown(
    weeklyBudget,
    budgetBufferPercentage
  );

  // Prorate usable budget if plan duration is less than 7 days
  const effectiveDays = selectedDays?.length
    ? selectedDays
    : getPlanDays(planDurationDays, cookFrequency);
  const durationScale = effectiveDays.length / 7;
  const proratedUsableBudget =
    weeklyBudget > 0 ? Math.round(usableBudget * durationScale * 100) / 100 : 0;
  const budgetCap =
    weeklyBudget > 0 ? proratedUsableBudget : Number.POSITIVE_INFINITY;

  // 2. Household capacity (Adults, Children, Seniors, Infants). Visitors are added per slot.
  const derivedComposition = familyMembers.length > 0
    ? compositionFromMembers(familyMembers)
    : householdComposition;
  const householdCapacity = calculateEffectiveServings(derivedComposition);

  // 3. Normalize active goals
  const activeGoalKeys = new Set(selectedGoals.map(normalizeGoalKey));
  if (activeGoalKeys.size === 0) activeGoalKeys.add('save_money');

  // 4. Build exception map: dishId -> boolean (allowedForPlan)
  const exceptionMap = new Map<number, boolean>();
  for (const exc of mealExceptions) {
    exceptionMap.set(exc.dishId, exc.allowedForPlan);
  }

  // 5. Filter Candidate Pool: Allergies + Religion (with Exception Overrides)
  const pantry = new Set(pantryItems.map(ingredientKey));
  const cookTimeCap = cookTimeCapMinutes(preferredCookTime);

  let excludedByAllergy = 0;
  let excludedByReligion = 0;

  const candidateDishes = dishes.filter((dish) => {
    const dishIngs = ingredientsByDishId.get(dish.id) ?? [];
    const ingNames = dishIngs.map((i) => i.ingredientName);

    // Hard rule: Allergens are always strictly excluded
    if (dishContainsAllergen(dish.name, ingNames, allergies)) {
      excludedByAllergy++;
      return false;
    }

    if (dishViolatesDietaryRestriction(dish.name, ingNames, dish.tags ?? '', dietaryRestrictions)) {
      excludedByReligion++;
      return false;
    }

    // Religion check: if explicitly allowed via exception, bypass religion restriction!
    const isExplicitlyAllowed = exceptionMap.get(dish.id) === true;
    if (!isExplicitlyAllowed) {
      if (
        isDishRestrictedByReligion(
          dish.name,
          dish.category,
          ingNames,
          religion,
          customFoodRestrictions,
          customFoodTerms
        )
      ) {
        excludedByReligion++;
        return false;
      }
    }

    return true;
  });

  // 6. Slots to fill
  const mealsToFill: string[] = includeSnacks
    ? ['breakfast', 'lunch', 'snack', 'dinner']
    : ['breakfast', 'lunch', 'dinner'];

  const entries: PlannedSlot[] = [];
  const alreadyBought = new Set<string>();
  const usageCount = new Map<number, number>();
  const categoryUsage = new Map<string, number>();
  let totalCost = 0;
  let skippedByAvailability = 0;

  const maxRepeatsPerDish = activeGoalKeys.has('meal_variety') ? 1 : 2;

  const meatDishIds = new Set(
    candidateDishes
      .filter((dish) =>
        isMeatDish(
          dish.name,
          dish.category,
          (ingredientsByDishId.get(dish.id) ?? []).map((i) => i.ingredientName)
        )
      )
      .map((dish) => dish.id)
  );

  for (const day of effectiveDays) {
    const meatless = weekStartDate ? isMeatlessDay(religion, dateForWeekDay(weekStartDate, day)) : false;
    const dayCandidates = meatless
      ? candidateDishes.filter((dish) => !meatDishIds.has(dish.id) || exceptionMap.get(dish.id) === true)
      : candidateDishes;

    for (const mealType of mealsToFill) {
      const slotHeadcount = eatersBySlot?.get(`${day}|${mealType}`) ?? householdCapacity;
      if (slotHeadcount <= 0) {
        skippedByAvailability++;
        continue;
      }
      const slotServings = slotHeadcount + visitorServingsForMeal(mealType, visitorBufferServings);

      // Score all candidate dishes for this slot
      const scored = dayCandidates
        .map((dish) => {
          const ings = ingredientsByDishId.get(dish.id) ?? [];
          const score = scoreDishMultiGoal(
            dish,
            ings,
            pantry,
            alreadyBought,
            activeGoalKeys,
            mealStyles,
            favoriteFoods,
            cookTimeCap,
            slotServings,
            categoryUsage,
            usageCount.get(dish.id) ?? 0
          );
          return { dish, ingredients: ings, score };
        })
        .sort((a, b) => b.score - a.score);

      // Filter by meal type suitability and max repeat threshold
      const suitable = scored.filter(({ dish }) => {
        const suits = dish.mealTypes
          ? dish.mealTypes.split(',').map((m) => m.trim().toLowerCase()).includes(mealType)
          : mealType === 'lunch' || mealType === 'dinner';
        if (!suits) return false;
        if ((usageCount.get(dish.id) ?? 0) >= maxRepeatsPerDish) return false;
        return true;
      });

      const preferred = cookTimeCap
        ? suitable.filter(({ dish }) => dish.prepTimeMinutes <= cookTimeCap)
        : suitable;
      let pool = preferred.length > 0 ? preferred : suitable;

      // Tight budget heuristic: when usable budget is running low, prioritize cost within top scoring candidates
      const remainingBudget = budgetCap - totalCost;
      if (Number.isFinite(budgetCap) && remainingBudget < budgetCap * 0.35) {
        pool = [...pool].sort((a, b) => {
          const ca = calculateIncrementalCost(
            a.ingredients,
            pantry,
            alreadyBought,
            getRecipeScaleFactor(a.dish.servings || 4, slotServings)
          ).cost;
          const cb = calculateIncrementalCost(
            b.ingredients,
            pantry,
            alreadyBought,
            getRecipeScaleFactor(b.dish.servings || 4, slotServings)
          ).cost;
          return ca - cb || b.score - a.score;
        });
      }

      let placed = false;
      for (const { dish, ingredients } of pool) {
        const scale = getRecipeScaleFactor(
          dish.servings || 4,
          slotServings
        );
        const { cost, newItems } = calculateIncrementalCost(
          ingredients,
          pantry,
          alreadyBought,
          scale
        );
        if (totalCost + cost > budgetCap) {
          if (mealType === 'snack') break; // Snack can be dropped to protect main meals
          continue;
        }

        entries.push({
          dishId: dish.id,
          dishName: dish.name,
          dayOfWeek: day,
          mealType,
          eaters: Math.round(slotHeadcount),
          servings: Math.max(1, Math.round(slotServings)),
        });

        usageCount.set(dish.id, (usageCount.get(dish.id) ?? 0) + 1);
        categoryUsage.set(dish.category, (categoryUsage.get(dish.category) ?? 0) + 1);
        for (const item of newItems) alreadyBought.add(item);
        totalCost += cost;
        placed = true;
        break;
      }

      // If no affordable new dish fits, attempt to reuse an already-bought dish (incremental cost = ₱0)
      if (!placed && mealType !== 'snack' && entries.length > 0) {
        const reuseCandidates = [...usageCount.keys()]
          .map((id) => scored.find((s) => s.dish.id === id))
          .filter(Boolean)
          .sort(
            (a, b) =>
              calculateIncrementalCost(
                a!.ingredients,
                pantry,
                alreadyBought,
                getRecipeScaleFactor(a!.dish.servings || 4, slotServings)
              ).cost -
              calculateIncrementalCost(
                b!.ingredients,
                pantry,
                alreadyBought,
                getRecipeScaleFactor(b!.dish.servings || 4, slotServings)
              ).cost
          );

        for (const candidate of reuseCandidates) {
          if (!candidate) continue;
          const { cost, newItems } = calculateIncrementalCost(
            candidate.ingredients,
            pantry,
            alreadyBought,
            getRecipeScaleFactor(
              candidate.dish.servings || 4,
              slotServings
            )
          );
          if (totalCost + cost > budgetCap) continue;

          const suits = candidate.dish.mealTypes
            ? candidate.dish.mealTypes.toLowerCase().includes(mealType)
            : mealType === 'lunch' || mealType === 'dinner';

          if (suits || mealType === 'lunch' || mealType === 'dinner') {
            entries.push({
              dishId: candidate.dish.id,
              dishName: candidate.dish.name,
              dayOfWeek: day,
              mealType,
              eaters: Math.round(slotHeadcount),
              servings: Math.max(1, Math.round(slotServings)),
            });
            for (const item of newItems) alreadyBought.add(item);
            totalCost += cost;
            break;
          }
        }
      }
    }
  }

  return {
    entries,
    estimatedGroceryCost: Math.round(totalCost * 100) / 100,
    excludedByAllergy,
    excludedByReligion,
    skippedByAvailability,
    totalBudget: weeklyBudget,
    reservedBuffer,
    usableBudget: proratedUsableBudget,
    withinBudget: !Number.isFinite(budgetCap) || totalCost <= budgetCap + 0.01,
    activeGoals: selectedGoals,
    durationDays: effectiveDays.length,
  };
}
