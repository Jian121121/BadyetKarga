import type { MealPlanEntry } from '../services/database/mealPlanRepository';
import type { PantryItem } from '../services/database/pantryRepository';
import type { DishIngredient } from '../services/database/dishIngredientRepository';
import type { PriceMemory } from '../services/database/priceMemoryRepository';
import { getRecipeScaleFactor } from '../shared/utils/householdServing';
import { ingredientKey, normalizeUnit } from '../shared/utils/ingredientKey';
import { categorizeIngredient } from '../shared/constants/groceryCategories';

export interface GeneratedGroceryItem {
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  usedInDishes: string; // comma-separated dish names, e.g. "Sinigang na Baboy, Chicken Adobo"
}

interface ParsedQuantity {
  amount: number;
  unit: string;
  baseAmount: number;
  baseUnit: string;
}

function parseQuantity(value: string): ParsedQuantity | null {
  const match = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+\.?)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = normalizeUnit(match[2]);
  if (!Number.isFinite(amount)) return null;
  if (unit === 'kg') return { amount, unit, baseAmount: amount * 1000, baseUnit: 'g' };
  if (unit === 'g') return { amount, unit, baseAmount: amount, baseUnit: 'g' };
  if (unit === 'l') return { amount, unit, baseAmount: amount * 1000, baseUnit: 'ml' };
  if (unit === 'ml') return { amount, unit, baseAmount: amount, baseUnit: 'ml' };
  return { amount, unit, baseAmount: amount, baseUnit: unit };
}

interface PantryStock {
  /** "on hand", blank, or a unit we can't compare: assume there is enough. */
  unlimited: boolean;
  /** Remaining amount per base unit; consumed as dishes use it. */
  remaining: Map<string, number>;
}

function buildPantryStock(pantry: PantryItem[]): Map<string, PantryStock> {
  const stock = new Map<string, PantryStock>();
  for (const item of pantry) {
    const key = ingredientKey(item.ingredientName);
    const entry = stock.get(key) ?? { unlimited: false, remaining: new Map<string, number>() };
    const parsed = parseQuantity(item.quantity ?? '');
    if (!parsed) entry.unlimited = true;
    else entry.remaining.set(parsed.baseUnit, (entry.remaining.get(parsed.baseUnit) ?? 0) + parsed.baseAmount);
    stock.set(key, entry);
  }
  return stock;
}

/** Amount of `required` covered by the pantry; deducts what it uses from `stock`. */
function consumePantry(required: number, unit: string, stock: PantryStock | undefined): number {
  if (!stock || required <= 0) return 0;
  if (stock.unlimited) return required;
  const requiredParsed = parseQuantity(`${required} ${unit}`);
  if (!requiredParsed) return required;
  const available = stock.remaining.get(requiredParsed.baseUnit);
  // Pantry tracked in a different unit (e.g. 1 kg garlic vs 1 head): treat as stocked.
  if (available === undefined) return stock.remaining.size > 0 ? required : 0;
  const perUnit = requiredParsed.baseAmount / required;
  const coveredBase = Math.min(available, requiredParsed.baseAmount);
  stock.remaining.set(requiredParsed.baseUnit, available - coveredBase);
  return coveredBase / perUnit;
}

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

/** Metric units share a base so "500 g" and "1 kg" of the same ingredient merge into one line. */
function unitFamily(unit: string): string {
  const u = normalizeUnit(unit);
  if (u === 'kg' || u === 'g') return 'g';
  if (u === 'l' || u === 'ml') return 'ml';
  return u;
}

const TO_BASE: Record<string, number> = { kg: 1000, g: 1, l: 1000, ml: 1 };

function convertAmount(amount: number, from: string, to: string): number {
  const f = TO_BASE[normalizeUnit(from)];
  const t = TO_BASE[normalizeUnit(to)];
  return f && t ? (amount * f) / t : amount;
}

const ceilTo = (value: number, step: number) => Math.round(Math.ceil(value / step - 1e-9) * step * 100) / 100;

/** Round a needed amount up to what a market actually sells (¼ kg steps, whole pieces, etc.). */
export function buyableQuantity(quantity: number, unit: string): number {
  if (quantity <= 0) return 0;
  switch (normalizeUnit(unit)) {
    case 'kg':
    case 'l':
      return ceilTo(quantity, 0.25);
    case 'g':
    case 'ml':
      if (quantity <= 100) return ceilTo(quantity, 25);
      if (quantity <= 500) return ceilTo(quantity, 50);
      return ceilTo(quantity, 250);
    case 'tbsp':
    case 'tsp':
    case 'cup':
      return ceilTo(quantity, 0.5);
    default:
      return Math.max(1, ceilTo(quantity, 1));
  }
}

function rememberedCost(memory: PriceMemory | undefined, key: string, quantity: number, unit: string): number | null {
  const saved = memory?.[key];
  if (!saved || saved.unitPrice <= 0) return null;
  if (unitFamily(saved.unit) !== unitFamily(unit)) return null;
  return Math.round(saved.unitPrice * convertAmount(quantity, unit, saved.unit) * 100) / 100;
}

/**
 * Core logic per capstone requirement:
 * 1. Every planned meal contributes its FULL ingredient list (not just a single line item)
 * 2. Ingredients with the same name are combined into ONE grocery item
 * 3. Combined quantity sums across all dishes that need it
 * 4. Combined price sums across all dishes that need it
 * 5. Priority takes the HIGHEST priority among all dishes using that ingredient
 * 6. Pantry quantities are subtracted when units are compatible
 * 7. Each merged item tracks which dishes it's used in, for the "tap to see which meals" UI
 * 8. Final quantities are rounded up to buyable amounts; remembered real prices replace estimates
 */
export function generateGroceryList(
  mealPlanEntries: MealPlanEntry[],
  allIngredientsForPlannedDishes: DishIngredient[],
  pantryItems: PantryItem[],
  plannedServingsBySlot?: Map<string, number>,
  priceMemory?: PriceMemory
): GeneratedGroceryItem[] {
  // Map dishId -> dish name, so we can label "usedInDishes" correctly
  const dishIdToName = new Map<number, string>();
  const dishServings = new Map<number, number>();
  for (const entry of mealPlanEntries) {
    if (entry.dishName) dishIdToName.set(entry.dishId, entry.dishName);
    if (entry.servings && entry.servings > 0) dishServings.set(entry.dishId, entry.servings);
  }

  const merged = new Map<string, GeneratedGroceryItem>();
  const pantryStock = buildPantryStock(pantryItems);

  for (const ingredient of allIngredientsForPlannedDishes) {
    const key = ingredientKey(ingredient.ingredientName);
    const dishName = dishIdToName.get(ingredient.dishId) ?? 'Unknown Dish';
    const recipeServings = dishServings.get(ingredient.dishId) ?? 4;
    const matchingEntries = mealPlanEntries.filter((entry) => entry.dishId === ingredient.dishId);
    const scale = matchingEntries.length > 0
      ? matchingEntries.reduce((total, entry) => {
          const plannedServings = plannedServingsBySlot?.get(`${entry.dayOfWeek}|${entry.mealType}`);
          return total + (plannedServings && recipeServings > 0
            ? getRecipeScaleFactor(recipeServings, plannedServings)
            : 1);
        }, 0)
      : 1;
    const requiredQuantity = ingredient.quantity * scale;
    const coveredQuantity = consumePantry(requiredQuantity, ingredient.unit, pantryStock.get(key));
    const quantity = Math.round(Math.max(0, requiredQuantity - coveredQuantity) * 100) / 100;
    if (quantity <= 0) continue;
    const estimatedPrice = Math.round(
      ingredient.estimatedPrice * (quantity / Math.max(requiredQuantity, 0.0001)) * 100
    ) / 100;

    const mergeKey = `${key}|${unitFamily(ingredient.unit)}`;
    const existing = merged.get(mergeKey);
    if (existing) {
      const added = convertAmount(quantity, ingredient.unit, existing.unit);
      existing.quantity = Math.round((existing.quantity + added) * 100) / 100;
      existing.estimatedCost = Math.round((existing.estimatedCost + estimatedPrice) * 100) / 100;
      if (PRIORITY_RANK[ingredient.priority] > PRIORITY_RANK[existing.priority]) {
        existing.priority = ingredient.priority;
      }
      if (!existing.usedInDishes.includes(dishName)) {
        existing.usedInDishes += `, ${dishName}`;
      }
    } else {
      merged.set(mergeKey, {
        ingredientName: ingredient.ingredientName,
        category: categorizeIngredient(ingredient.ingredientName),
        quantity,
        unit: ingredient.unit,
        estimatedCost: estimatedPrice,
        priority: ingredient.priority,
        usedInDishes: dishName,
      });
    }
  }

  return Array.from(merged.values()).map((item) => {
    const buyQty = buyableQuantity(item.quantity, item.unit);
    const remembered = rememberedCost(priceMemory, ingredientKey(item.ingredientName), buyQty, item.unit);
    const scaled = item.quantity > 0 ? item.estimatedCost * (buyQty / item.quantity) : item.estimatedCost;
    return {
      ...item,
      quantity: buyQty,
      estimatedCost: Math.round((remembered ?? scaled) * 100) / 100,
    };
  });
}