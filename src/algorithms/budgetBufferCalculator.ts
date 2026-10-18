import { normalizeGoalKey } from '../shared/constants/householdGoals';
import { calculateEffectiveServings, VISITOR_MEALS } from '../shared/utils/householdServing';

/**
 * Budget Buffer Calculator
 *
 * Decides how much of the weekly grocery budget is held back as an emergency
 * reserve. The percentage is always system-calculated, never typed by the user.
 *
 *   core     = clamp(basePercent + goalAdjustment + householdAdjustment, MIN, MAX)
 *   buffer   = min(core + visitorAdjustment, MAX_WITH_VISITORS)
 *
 * - basePercent: larger budgets can afford a larger cushion; tight budgets keep
 *   more money available for meals.
 * - goalAdjustment: saving-oriented goals raise the reserve, quantity-oriented
 *   goals lower it.
 * - householdAdjustment: seniors and infants/toddlers add unpredictability
 *   (special diets, formula, medicine).
 * - visitorAdjustment: unexpected guests. Visitor servings are already cooked at
 *   lunch and dinner, so this is the contingency for guests arriving more often,
 *   in bigger groups, or at other meals. It grows with the share of the week's
 *   food that goes to visitors relative to the household's own appetite.
 *
 * The breakdown fields are for documentation/demo only; the UI shows just the
 * plain-language summary from formatBudgetBufferSummary().
 */

export const MIN_BUFFER_PERCENT = 5;
export const MAX_BUFFER_PERCENT = 20;
/** Ceiling once the visitor contingency is added on top of the core reserve. */
export const MAX_BUFFER_WITH_VISITORS_PERCENT = 25;
export const MAX_VISITOR_ADJUSTMENT = 8;
/** Share of the visitors' food cost held back as contingency. */
const VISITOR_CONTINGENCY_RATE = 0.3;
const MEALS_PER_DAY = 4;

export interface BudgetBufferInput {
  weeklyBudget: number;
  selectedGoals: string[];
  adults?: number;
  children?: number;
  seniors?: number;
  infantsToddlers?: number;
  visitorBufferServings?: number;
}

export interface BudgetBufferResult {
  bufferPercentage: number;
  bufferAmount: number;
  basePercent: number;
  goalAdjustment: number;
  householdAdjustment: number;
  visitorAdjustment: number;
}

const BUDGET_TIERS: Array<{ below: number; percent: number }> = [
  { below: 2000, percent: 5 },
  { below: 3500, percent: 7 },
  { below: 5500, percent: 9 },
  { below: 8000, percent: 11 },
];
const TOP_TIER_PERCENT = 12;

const GOAL_WEIGHTS: Record<string, number> = {
  save_money: 3,
  minimize_grocery_trips: 2,
  minimize_food_waste: 1,
  family_friendly: 1,
  healthy: 1,
  quick_meals: -1,
  maximize_food_quantity: -2,
};

function basePercentFor(budget: number): number {
  return BUDGET_TIERS.find((tier) => budget < tier.below)?.percent ?? TOP_TIER_PERCENT;
}

function goalAdjustmentFor(goals: string[]): number {
  const unique = new Set(goals.map(normalizeGoalKey));
  let total = 0;
  for (const key of unique) total += GOAL_WEIGHTS[key] ?? 0;
  return total;
}

function householdAdjustmentFor(input: BudgetBufferInput): number {
  const seniors = Math.max(0, input.seniors ?? 0);
  const infants = Math.max(0, input.infantsToddlers ?? 0);
  return Math.min(3, seniors) + Math.min(3, infants * 1.5);
}

/**
 * Visitors eat lunch + dinner only, so their daily load is
 * visitors × (2 / 4 meals). Their share of total food drives the contingency.
 */
function visitorAdjustmentFor(input: BudgetBufferInput): number {
  const visitors = Math.max(0, input.visitorBufferServings ?? 0);
  if (visitors === 0) return 0;
  const householdServings = calculateEffectiveServings({
    adults: input.adults ?? 1,
    children: input.children ?? 0,
    seniors: input.seniors ?? 0,
    infantsToddlers: input.infantsToddlers ?? 0,
  });
  const visitorLoad = visitors * (VISITOR_MEALS.length / MEALS_PER_DAY);
  const visitorShare = visitorLoad / (householdServings + visitorLoad);
  return Math.min(MAX_VISITOR_ADJUSTMENT, Math.max(1, visitorShare * 100 * VISITOR_CONTINGENCY_RATE));
}

export function calculateBudgetBuffer(input: BudgetBufferInput): BudgetBufferResult {
  const budget = Math.max(0, Number.isFinite(input.weeklyBudget) ? input.weeklyBudget : 0);
  if (budget <= 0) {
    return {
      bufferPercentage: 0,
      bufferAmount: 0,
      basePercent: 0,
      goalAdjustment: 0,
      householdAdjustment: 0,
      visitorAdjustment: 0,
    };
  }

  const basePercent = basePercentFor(budget);
  const goalAdjustment = goalAdjustmentFor(input.selectedGoals);
  const householdAdjustment = householdAdjustmentFor(input);
  const visitorAdjustment = visitorAdjustmentFor(input);

  const core = Math.max(
    MIN_BUFFER_PERCENT,
    Math.min(MAX_BUFFER_PERCENT, basePercent + goalAdjustment + householdAdjustment)
  );
  const bufferPercentage = Math.round(Math.min(MAX_BUFFER_WITH_VISITORS_PERCENT, core + visitorAdjustment));
  const bufferAmount = Math.round(budget * bufferPercentage) / 100;

  return {
    bufferPercentage,
    bufferAmount,
    basePercent,
    goalAdjustment,
    householdAdjustment,
    visitorAdjustment: Math.round(visitorAdjustment * 10) / 10,
  };
}

/**
 * "X% reserved (₱Y) based on your budget and goals"
 * (mentions the visitor buffer when the household has one)
 */
export function formatBudgetBufferSummary(
  bufferPercentage: number,
  weeklyBudget: number,
  visitorBufferServings = 0
): string {
  const amount = Math.round(Math.max(0, weeklyBudget) * Math.max(0, bufferPercentage)) / 100;
  const peso = amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const basis = visitorBufferServings > 0 ? 'your budget, goals, and visitor buffer' : 'your budget and goals';
  return `${bufferPercentage}% reserved (₱${peso}) based on ${basis}`;
}
