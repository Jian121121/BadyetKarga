import type { MealPlanEntry } from '../services/database/mealPlanRepository';
import type { PantryItem } from '../services/database/pantryRepository';

export interface GeneratedGroceryItem {
  ingredientName: string;
  category: string;
  estimatedCost: number;
}

/**
 * Simplified grocery generation: since we don't yet have a full
 * ingredients-per-dish table, we treat each planned dish's cost as
 * one grocery line item named after the dish, minus anything already
 * in pantry (matched by name). Real ingredient-level breakdown is a
 * documented future improvement once Dish->Ingredients data exists.
 */
export function generateGroceryList(
  mealPlanEntries: MealPlanEntry[],
  pantryItems: PantryItem[]
): GeneratedGroceryItem[] {
  const pantryNames = new Set(pantryItems.map((p) => p.ingredientName.toLowerCase()));

  const merged = new Map<string, GeneratedGroceryItem>();
  for (const entry of mealPlanEntries) {
    if (!entry.dishName) continue;
    if (pantryNames.has(entry.dishName.toLowerCase())) continue; // already in pantry

    const existing = merged.get(entry.dishName);
    if (existing) {
      existing.estimatedCost += entry.estimatedCost ?? 0;
    } else {
      merged.set(entry.dishName, {
        ingredientName: entry.dishName,
        category: 'Meals',
        estimatedCost: entry.estimatedCost ?? 0,
      });
    }
  }

  return Array.from(merged.values());
}