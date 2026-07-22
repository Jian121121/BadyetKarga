import type { MealPlanEntry } from '../services/database/mealPlanRepository';
import type { PantryItem } from '../services/database/pantryRepository';
import type { DishIngredient } from '../services/database/dishIngredientRepository';

export interface GeneratedGroceryItem {
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  usedInDishes: string; // comma-separated dish names, e.g. "Sinigang na Baboy, Chicken Adobo"
}

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

/**
 * Core logic per capstone requirement:
 * 1. Every planned meal contributes its FULL ingredient list (not just a single line item)
 * 2. Ingredients with the same name are combined into ONE grocery item
 * 3. Combined quantity sums across all dishes that need it
 * 4. Combined price sums across all dishes that need it
 * 5. Priority takes the HIGHEST priority among all dishes using that ingredient
 * 6. Ingredients already in the pantry are excluded entirely
 * 7. Each merged item tracks which dishes it's used in, for the "tap to see which meals" UI
 */
export function generateGroceryList(
  mealPlanEntries: MealPlanEntry[],
  allIngredientsForPlannedDishes: DishIngredient[],
  pantryItems: PantryItem[]
): GeneratedGroceryItem[] {
  const pantryNames = new Set(pantryItems.map((p) => p.ingredientName.toLowerCase()));

  // Map dishId -> dish name, so we can label "usedInDishes" correctly
  const dishIdToName = new Map<number, string>();
  for (const entry of mealPlanEntries) {
    if (entry.dishName) dishIdToName.set(entry.dishId, entry.dishName);
  }

  const merged = new Map<string, GeneratedGroceryItem>();

  for (const ingredient of allIngredientsForPlannedDishes) {
    const key = ingredient.ingredientName.toLowerCase();
    if (pantryNames.has(key)) continue; // already have it, skip entirely

    const dishName = dishIdToName.get(ingredient.dishId) ?? 'Unknown Dish';

    const existing = merged.get(key);
    if (existing) {
      existing.quantity += ingredient.quantity;
      existing.estimatedCost += ingredient.estimatedPrice;
      if (PRIORITY_RANK[ingredient.priority] > PRIORITY_RANK[existing.priority]) {
        existing.priority = ingredient.priority;
      }
      if (!existing.usedInDishes.includes(dishName)) {
        existing.usedInDishes += `, ${dishName}`;
      }
    } else {
      merged.set(key, {
        ingredientName: ingredient.ingredientName,
        category: 'Grocery',
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        estimatedCost: ingredient.estimatedPrice,
        priority: ingredient.priority,
        usedInDishes: dishName,
      });
    }
  }

  return Array.from(merged.values());
}