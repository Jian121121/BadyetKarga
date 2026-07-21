import type { GroceryItem } from '../services/database/groceryRepository';

export interface OptimizationSuggestion {
  itemName: string;
  currentCost: number;
  suggestion: string;
  potentialSavings: number;
}

/**
 * Simplified optimization: flags the most expensive items and suggests
 * a flat 15% potential savings via substitution. Real ingredient-level
 * substitution logic is a documented future improvement.
 */
export function optimizeBudget(items: GroceryItem[], weeklyBudget: number): {
  totalCost: number;
  isOverBudget: boolean;
  suggestions: OptimizationSuggestion[];
} {
  const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);
  const isOverBudget = totalCost > weeklyBudget;

  const suggestions: OptimizationSuggestion[] = [];
  if (isOverBudget) {
    const sorted = [...items].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 3);
    for (const item of sorted) {
      suggestions.push({
        itemName: item.ingredientName,
        currentCost: item.estimatedCost,
        suggestion: `Consider a cheaper alternative for ${item.ingredientName}`,
        potentialSavings: Math.round(item.estimatedCost * 0.15),
      });
    }
  }

  return { totalCost, isOverBudget, suggestions };
}