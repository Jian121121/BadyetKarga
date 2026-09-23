import { normalizeGoalKey } from '../constants/householdGoals';

export interface HouseholdComposition {
  totalMembers: number;
  adults: number;
  children: number;
  seniors: number;
  infantsToddlers: number;
}

export interface HouseholdMemberProfile {
  age?: string | number | null;
  relationship?: string | null;
}

/** Derive composition from the existing family-member records. */
export function compositionFromMembers(members: HouseholdMemberProfile[]): HouseholdComposition {
  const composition: HouseholdComposition = {
    totalMembers: members.length,
    adults: 0,
    children: 0,
    seniors: 0,
    infantsToddlers: 0,
  };

  for (const member of members) {
    const age = Number.parseInt(String(member.age ?? ''), 10);
    const relationship = (member.relationship ?? '').toLowerCase();
    if (Number.isFinite(age)) {
      if (age <= 3) composition.infantsToddlers++;
      else if (age < 18) composition.children++;
      else if (age >= 60) composition.seniors++;
      else composition.adults++;
    } else if (/infant|toddler|baby/.test(relationship)) {
      composition.infantsToddlers++;
    } else if (/child|son|daughter/.test(relationship)) {
      composition.children++;
    } else if (/senior|grandparent|grandma|grandpa/.test(relationship)) {
      composition.seniors++;
    } else {
      composition.adults++;
    }
  }

  return composition;
}

export const VISITOR_BUFFER_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '1 Extra Serving', value: 1 },
  { label: '2 Extra Servings', value: 2 },
  { label: '3 Extra Servings', value: 3 },
  { label: '4 Extra Servings', value: 4 },
  { label: '5+ Extra Servings', value: 5 },
] as const;

/**
 * System-chosen emergency reserve. Users do not pick 5/10/15%.
 * Uses weekly budget tightness, household goals (especially saving),
 * and cooking lifestyle / meal style.
 */
export function recommendBudgetBufferPercentage(input: {
  weeklyBudget: number;
  goals?: string[];
  mealStyles?: string[];
}): number {
  const budget = Math.max(0, input.weeklyBudget);
  if (budget <= 0) return 0;

  let pct = 8;
  if (budget < 2000) pct = 5;
  else if (budget < 3500) pct = 8;
  else if (budget < 5500) pct = 10;
  else if (budget < 8000) pct = 12;
  else pct = 14;

  const goals = (input.goals ?? []).map((goal) => normalizeGoalKey(goal));
  if (goals.includes('save_money')) pct += 3;
  if (goals.includes('minimize_grocery_trips')) pct += 2;
  if (goals.includes('minimize_food_waste')) pct += 1;
  if (goals.includes('family_friendly')) pct += 1;
  if (goals.includes('healthy')) pct += 1;
  if (goals.includes('maximize_food_quantity')) pct -= 2;

  const styles = (input.mealStyles ?? []).map((style) => style.toLowerCase());
  if (styles.some((style) => style.includes('budget'))) pct += 2;
  if (styles.some((style) => style.includes('healthy'))) pct += 1;
  if (styles.some((style) => style.includes('mixed'))) pct += 1;
  if (styles.some((style) => style.includes('quick'))) pct -= 1;

  return Math.max(5, Math.min(18, Math.round(pct)));
}

export const PLAN_DURATION_OPTIONS = [
  { label: '1 Day (Today)', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '5 Days (Weekdays)', days: 5 },
  { label: '7 Days (Full Week)', days: 7 },
] as const;

/**
 * Household member serving volume equivalents:
 * - Adult: 1.0 portion
 * - Senior: 0.85 portion
 * - Child: 0.65 portion
 * - Infant / Toddler: 0.35 portion
 */
export function calculateEffectiveServings(
  composition: Partial<HouseholdComposition>,
  visitorBufferServings: number = 0
): number {
  const adults = Math.max(0, composition.adults ?? 1);
  const seniors = Math.max(0, composition.seniors ?? 0);
  const children = Math.max(0, composition.children ?? 0);
  const infants = Math.max(0, composition.infantsToddlers ?? 0);

  const rawServings = adults * 1.0 + seniors * 0.85 + children * 0.65 + infants * 0.35;
  const withBuffer = rawServings + Math.max(0, visitorBufferServings);

  // Return rounded to 1 decimal place, minimum 1 serving
  return Math.max(1, Math.round(withBuffer * 10) / 10);
}

/**
 * Calculates reserved buffer amount and usable meal planning budget.
 */
export function calculateBudgetBreakdown(
  totalBudget: number,
  bufferPercentage: number
): {
  totalBudget: number;
  bufferPercentage: number;
  reservedBuffer: number;
  usableBudget: number;
} {
  const budget = Math.max(0, totalBudget);
  const pct = Math.max(0, Math.min(100, bufferPercentage));
  const reservedBuffer = Math.round(budget * (pct / 100) * 100) / 100;
  const usableBudget = Math.max(0, Math.round((budget - reservedBuffer) * 100) / 100);

  return {
    totalBudget: budget,
    bufferPercentage: pct,
    reservedBuffer,
    usableBudget,
  };
}

/**
 * Helper to compute recipe scaling factor against target household capacity.
 */
export function getRecipeScaleFactor(recipeServings: number, targetCapacity: number): number {
  if (!recipeServings || recipeServings <= 0) return 1;
  if (!targetCapacity || targetCapacity <= 0) return 1;
  const factor = targetCapacity / recipeServings;
  // Keep factor reasonable between 0.5x and 3.0x
  return Math.min(3.0, Math.max(0.5, Math.round(factor * 100) / 100));
}

