import type { GroceryItem } from '../services/database/groceryRepository';
import { calculateBudgetBreakdown } from '../shared/utils/householdServing';
import { categorizeIngredient } from '../shared/constants/groceryCategories';

export interface OptimizationSuggestion {
  id: string;
  type: 'substitution' | 'reduction' | 'optional_removal' | 'quantity_adjustment' | 'ingredient_reuse';
  title: string;
  itemName: string;
  replacementName?: string;
  currentCost: number;
  suggestion: string;
  potentialSavings: number;
  actionableHint?: string;
  impactLevel: 'low' | 'medium' | 'high';
}

export interface BudgetOptimizationResult {
  totalCost: number;
  totalBudget: number;
  reservedBuffer: number;
  usableBudget: number;
  isOverBudget: boolean;
  overAmount: number;
  projectedSavings: number;
  projectedCost: number;
  suggestions: OptimizationSuggestion[];
}

/**
 * Smart Multi-Tier Budget Optimization Engine
 *
 * Evaluates individual ingredients, priorities, and costs:
 * 1. Low-priority ingredients (optional seasonings, bay leaves, star anise, garnishes)
 * 2. Cheaper protein & vegetable substitutions (beef -> chicken/pork, premium cuts -> regular cuts)
 * 3. Quantity & portion adjustments for high-cost items
 * 4. Multi-meal ingredient consolidation and reuse
 */
export function optimizeBudget(
  items: GroceryItem[],
  weeklyBudget: number,
  bufferPercentage: number = 0
): BudgetOptimizationResult {
  const { reservedBuffer, usableBudget } = calculateBudgetBreakdown(weeklyBudget, bufferPercentage);
  const totalCost = Math.round(items.reduce((sum, i) => sum + i.estimatedCost, 0) * 100) / 100;
  const effectiveBudget = usableBudget > 0 ? usableBudget : weeklyBudget;
  const isOverBudget = effectiveBudget > 0 && totalCost > effectiveBudget;
  const overAmount = isOverBudget ? Math.round((totalCost - effectiveBudget) * 100) / 100 : 0;

  const suggestions: OptimizationSuggestion[] = [];
  let nextId = 1;

  // 1. Low-Priority / Optional Ingredients (Safe removals or reductions)
  const lowPriorityItems = items.filter((i) => i.priority === 'low' && i.estimatedCost >= 10);
  for (const item of lowPriorityItems) {
    const savings = Math.round(item.estimatedCost * 0.85);
    suggestions.push({
      id: `opt-${nextId++}`,
      type: 'optional_removal',
      title: `Reduce or skip optional ${item.ingredientName}`,
      itemName: item.ingredientName,
      currentCost: item.estimatedCost,
      suggestion: `This low-priority ingredient in ${item.usedInDishes || 'meals'} can be reduced or substituted with existing pantry spices.`,
      potentialSavings: savings,
      actionableHint: 'Garnishes and optional aromatics can be scaled back without sacrificing core nutrition.',
      impactLevel: 'low',
    });
  }

  // 2. High-Cost Meat & Seafood Substitutions
  const expensiveMeats = items.filter(
    (i) =>
      (['Meat', 'Fish & Seafood'].includes(categorizeIngredient(i.ingredientName)) ||
        /beef|oxtail|brisket|shrimp|pork/i.test(i.ingredientName)) &&
      i.estimatedCost >= 120
  );
  for (const item of expensiveMeats) {
    const nameLower = item.ingredientName.toLowerCase();
    let substitute = 'chicken or tofu';
    let savingsPct = 0.25;

    if (nameLower.includes('beef') || nameLower.includes('oxtail') || nameLower.includes('brisket')) {
      substitute = 'pork kasim or chicken thigh';
      savingsPct = 0.35;
    } else if (nameLower.includes('shrimp') || nameLower.includes('hipon')) {
      substitute = 'bangus (milkfish) or tilapia';
      savingsPct = 0.3;
    } else if (nameLower.includes('pork')) {
      substitute = 'chicken breast/thigh';
      savingsPct = 0.2;
    }

    const potentialSavings = Math.round(item.estimatedCost * savingsPct);
    suggestions.push({
      id: `opt-${nextId++}`,
      type: 'substitution',
      title: `Switch ${item.ingredientName} to ${substitute}`,
      itemName: item.ingredientName,
      replacementName: substitute.split(' or ')[0],
      currentCost: item.estimatedCost,
      suggestion: `Substituting with ${substitute} saves approximately ₱${potentialSavings} while maintaining high protein.`,
      potentialSavings,
      actionableHint: `Used in: ${item.usedInDishes || 'Planned meals'}`,
      impactLevel: 'high',
    });
  }

  // 3. High-Cost Produce & Vegetable Portions
  const expensiveVeggies = items.filter(
    (i) =>
      categorizeIngredient(i.ingredientName) === 'Vegetables & Fruits' &&
      i.estimatedCost >= 40 &&
      !suggestions.some((s) => s.itemName === i.ingredientName)
  );
  for (const item of expensiveVeggies) {
    const savings = Math.round(item.estimatedCost * 0.25);
    suggestions.push({
      id: `opt-${nextId++}`,
      type: 'quantity_adjustment',
      title: `Adjust ${item.ingredientName} quantity`,
      itemName: item.ingredientName,
      currentCost: item.estimatedCost,
      suggestion: `Buy seasonal wet-market bundles or slightly trim the batch size to save ₱${savings}.`,
      potentialSavings: savings,
      actionableHint: `Used in: ${item.usedInDishes || 'Planned meals'}`,
      impactLevel: 'medium',
    });
  }

  // 4. Ingredient Consolidation / Shared Staples
  const multiDishItems = items.filter(
    (i) => (((i.usedInDishes ?? '').match(/,/g) || []).length) >= 2
  );
  for (const item of multiDishItems) {
    if (!suggestions.some((s) => s.itemName === item.ingredientName) && item.estimatedCost >= 30) {
      const bulkSavings = Math.round(item.estimatedCost * 0.15);
      suggestions.push({
        id: `opt-${nextId++}`,
        type: 'ingredient_reuse',
        title: `Buy ${item.ingredientName} in bulk for shared dishes`,
        itemName: item.ingredientName,
        currentCost: item.estimatedCost,
        suggestion: `Shared across ${item.usedInDishes || 'multiple meals'}. Purchasing a single bulk pack at the market saves ₱${bulkSavings}.`,
        potentialSavings: bulkSavings,
        actionableHint: 'Consolidated purchase reduces unit cost.',
        impactLevel: 'low',
      });
    }
  }

  // Sort suggestions by potential savings descending
  suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);

  const projectedSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
  const projectedCost = Math.max(0, totalCost - projectedSavings);

  return {
    totalCost,
    totalBudget: weeklyBudget,
    reservedBuffer,
    usableBudget: effectiveBudget,
    isOverBudget,
    overAmount,
    projectedSavings,
    projectedCost,
    suggestions,
  };
}