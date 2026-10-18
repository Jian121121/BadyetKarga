import type { Dish } from '../services/database/dishRepository';
import type { MealPlanEntry } from '../services/database/mealPlanRepository';
import { HOUSEHOLD_GOALS, normalizeGoalKey } from '../shared/constants/householdGoals';
import type { GoalDefinition } from '../shared/constants/householdGoals';

export type GoalStatus = 'good' | 'warn' | 'none';

export interface GoalProgress {
  key: string;
  label: string;
  icon: GoalDefinition['icon'];
  /** e.g. "3 of 14 meals (21%)" */
  metric: string;
  /** e.g. "Target 30%+" */
  target: string;
  /** 0–1 fill for the progress bar (1 = target reached). */
  progress: number;
  status: GoalStatus;
}

export interface GoalProgressInput {
  goals: string[];
  entries: Pick<MealPlanEntry, 'dishId' | 'mealType'>[];
  dishes: Dish[];
  groceryItems: { usedInDishes: string }[];
  realTripsThisWeek: number;
  basisSpend: number;
  usableBudget: number;
}

const VEG_NAME = /gulay|chop suey|pinakbet|laing|ginisang|ampalaya|monggo|kangkong|sitaw|talong|togue|upo|sayote|malunggay/i;
const PROTEIN_CATEGORIES = new Set(['Beef', 'Pork', 'Chicken', 'Fish & Seafood']);
const PROTEIN_NAME = /egg|itlog|tokwa|tofu|monggo|sardin|tuna|longganisa|tapa|tocino/i;
const FAMILY_NAME = /adobo|sinigang|tinola|menudo|pancit|caldereta|arroz caldo|champorado/i;
const MAIN_MEALS = new Set(['lunch', 'dinner']);

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function shareGoal(
  hits: number,
  total: number,
  targetPct: number,
  noun: string
): Pick<GoalProgress, 'metric' | 'target' | 'progress' | 'status'> {
  if (total === 0) {
    return { metric: 'Plan some meals to track this', target: `Target ${targetPct}%+`, progress: 0, status: 'none' };
  }
  const share = pct(hits, total);
  return {
    metric: `${hits} of ${total} ${noun} (${share}%)`,
    target: `Target ${targetPct}%+`,
    progress: Math.min(1, share / targetPct),
    status: share >= targetPct ? 'good' : 'warn',
  };
}

function isVeg(dish: Dish) {
  return dish.category === 'Vegetables' || VEG_NAME.test(dish.name);
}

/** Measures this week's plan, grocery list, and spending against each selected household goal. */
export function calculateGoalProgress(input: GoalProgressInput): GoalProgress[] {
  const dishById = new Map(input.dishes.map((d) => [d.id, d]));
  const planned = input.entries
    .map((e) => ({ entry: e, dish: dishById.get(e.dishId) }))
    .filter((p): p is { entry: GoalProgressInput['entries'][number]; dish: Dish } => !!p.dish);
  const mains = planned.filter((p) => MAIN_MEALS.has(p.entry.mealType));
  const keys = [...new Set(input.goals.map(normalizeGoalKey))];

  return keys.flatMap((key): GoalProgress[] => {
    const def = HOUSEHOLD_GOALS.find((g) => g.id === key);
    if (!def) return [];
    const base = { key, label: def.shortLabel ?? def.label, icon: def.icon };

    switch (key) {
      case 'save_money': {
        if (input.usableBudget <= 0) {
          return [{ ...base, metric: 'Set a weekly budget to track this', target: 'Stay within budget', progress: 0, status: 'none' }];
        }
        const used = pct(input.basisSpend, input.usableBudget);
        return [{
          ...base,
          metric: `${used}% of meal budget used`,
          target: 'Stay at or under 100%',
          progress: Math.min(1, input.basisSpend / input.usableBudget),
          status: used <= 100 ? 'good' : 'warn',
        }];
      }
      case 'healthy':
        return [{ ...base, ...shareGoal(planned.filter((p) => isVeg(p.dish) || p.dish.category === 'Fish & Seafood').length, planned.length, 40, 'meals are veggie or fish') }];
      case 'more_vegetables':
        return [{ ...base, ...shareGoal(planned.filter((p) => isVeg(p.dish)).length, planned.length, 30, 'meals are vegetable dishes') }];
      case 'high_protein':
        return [{ ...base, ...shareGoal(mains.filter((p) => PROTEIN_CATEGORIES.has(p.dish.category) || PROTEIN_NAME.test(p.dish.name)).length, mains.length, 60, 'lunches/dinners are protein-rich') }];
      case 'family_friendly':
        return [{ ...base, ...shareGoal(planned.filter((p) => FAMILY_NAME.test(p.dish.name) || /family favorite|traditional filipino/i.test(p.dish.tags ?? '')).length, planned.length, 40, 'meals are family classics') }];
      case 'quick_meals':
        return [{ ...base, ...shareGoal(planned.filter((p) => p.dish.prepTimeMinutes <= 30).length, planned.length, 60, 'meals take 30 min or less') }];
      case 'meal_variety': {
        const unique = new Set(planned.map((p) => p.dish.id)).size;
        return [{ ...base, ...shareGoal(unique, planned.length, 70, 'meals are different dishes') }];
      }
      case 'minimize_food_waste': {
        const generated = input.groceryItems.filter((g) => g.usedInDishes && g.usedInDishes !== 'Added manually');
        const shared = generated.filter((g) => g.usedInDishes.includes(',')).length;
        return [{ ...base, ...shareGoal(shared, generated.length, 30, 'grocery items are shared by 2+ dishes') }];
      }
      case 'minimize_grocery_trips': {
        const trips = input.realTripsThisWeek;
        if (trips === 0) {
          return [{ ...base, metric: 'No shopping trips yet this week', target: 'Target 1–2 trips', progress: 0, status: 'none' }];
        }
        return [{
          ...base,
          metric: `${trips} trip${trips === 1 ? '' : 's'} this week`,
          target: 'Target 1–2 trips',
          progress: Math.min(1, 2 / trips),
          status: trips <= 2 ? 'good' : 'warn',
        }];
      }
      case 'maximize_food_quantity':
        return [{ ...base, ...shareGoal(planned.filter((p) => p.dish.servings >= 4).length, planned.length, 50, 'meals serve 4 or more') }];
      default:
        return [];
    }
  });
}

export interface ServingCostInput {
  weekSpend: number;
  /** Household effective servings (adult-equivalents), without visitors. */
  householdServings: number;
  /** Total servings across this week's planned meals (eaters + visitors per slot). */
  plannedServings: number;
}

export interface ServingCost {
  perPersonPerDay: number;
  perServing: number | null;
}

export function calculateServingCost({ weekSpend, householdServings, plannedServings }: ServingCostInput): ServingCost {
  const people = Math.max(1, householdServings);
  return {
    perPersonPerDay: weekSpend / people / 7,
    perServing: plannedServings > 0 ? weekSpend / plannedServings : null,
  };
}

export type BufferState = 'untouched' | 'partial' | 'used' | 'exceeded';

export interface BufferStatus {
  state: BufferState;
  reserve: number;
  /** Part of the reserve set aside for unexpected visitors. */
  visitorReserve: number;
  used: number;
  left: number;
  /** Spend beyond the whole weekly budget (reserve included). */
  overTotal: number;
  usedPercent: number;
}

export function calculateBufferStatus(input: {
  weekSpend: number;
  usableBudget: number;
  reservedBuffer: number;
  weeklyBudget: number;
  visitorAdjustmentPercent: number;
}): BufferStatus {
  const reserve = Math.max(0, input.reservedBuffer);
  const used = Math.min(reserve, Math.max(0, input.weekSpend - input.usableBudget));
  const overTotal = Math.max(0, input.weekSpend - input.weeklyBudget);
  const visitorReserve = Math.min(reserve, Math.round(input.weeklyBudget * (input.visitorAdjustmentPercent / 100)));
  let state: BufferState = 'untouched';
  if (overTotal > 0) state = 'exceeded';
  else if (reserve > 0 && used >= reserve) state = 'used';
  else if (used > 0) state = 'partial';
  return {
    state,
    reserve,
    visitorReserve,
    used,
    left: reserve - used,
    overTotal,
    usedPercent: reserve > 0 ? Math.round((used / reserve) * 100) : 0,
  };
}
