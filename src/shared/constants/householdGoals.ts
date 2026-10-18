import type { MaterialIcons } from '@expo/vector-icons';

export interface GoalDefinition {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  shortLabel?: string;
}

export const HOUSEHOLD_GOALS: GoalDefinition[] = [
  {
    id: 'save_money',
    label: 'Save Money',
    shortLabel: 'Save Money',
    description: 'Prioritize budget tracking and finding cheaper grocery alternatives.',
    icon: 'payments',
  },
  {
    id: 'healthy',
    label: 'Eat Healthier',
    shortLabel: 'Healthy',
    description: 'Focus on balanced nutrition, wholesome ingredients, and nourishing meals.',
    icon: 'favorite',
  },
  {
    id: 'high_protein',
    label: 'High Protein',
    shortLabel: 'High Protein',
    description: 'Favor protein-packed meals with lean meats, eggs, and legumes.',
    icon: 'fitness-center',
  },
  {
    id: 'more_vegetables',
    label: 'More Vegetables',
    shortLabel: 'More Veggies',
    description: 'Incorporate leafy greens, vegetable stews, and fresh produce.',
    icon: 'eco',
  },
  {
    id: 'family_friendly',
    label: 'Family Friendly',
    shortLabel: 'Family Favorites',
    description: 'Crowd-pleasing Filipino classics suitable for both kids and adults.',
    icon: 'group',
  },
  {
    id: 'quick_meals',
    label: 'Quick & Easy Meals',
    shortLabel: 'Quick Meals',
    description: 'Fast preparation dishes under 30 minutes for busy days.',
    icon: 'bolt',
  },
  {
    id: 'meal_variety',
    label: 'Meal Variety',
    shortLabel: 'Variety',
    description: 'Diversify weekly rotation to avoid repetitive meals.',
    icon: 'dashboard',
  },
  {
    id: 'minimize_food_waste',
    label: 'Minimize Food Waste',
    shortLabel: 'Less Waste',
    description: 'Pair recipes that share fresh aromatics, produce, and staple items.',
    icon: 'compost',
  },
  {
    id: 'minimize_grocery_trips',
    label: 'Minimize Grocery Trips',
    shortLabel: 'Fewer Trips',
    description: 'Rely on consolidated staple ingredients and long shelf-life pantry items.',
    icon: 'shopping-cart',
  },
  {
    id: 'maximize_food_quantity',
    label: 'Maximize Food Quantity',
    shortLabel: 'Large Portions',
    description: 'Focus on high-yield, generous-batch stews, soups, and rice dishes.',
    icon: 'layers',
  },
];

export type HouseholdGoalLabel = (typeof HOUSEHOLD_GOALS)[number]['label'];

export function normalizeGoalKey(goalOrLabel: string): string {
  const lower = goalOrLabel.toLowerCase().trim();
  if (lower.includes('save') || lower.includes('budget')) return 'save_money';
  if (lower.includes('health')) return 'healthy';
  if (lower.includes('protein')) return 'high_protein';
  if (lower.includes('veg')) return 'more_vegetables';
  if (lower.includes('family')) return 'family_friendly';
  if (lower.includes('quick') || lower.includes('fast') || lower.includes('easy')) return 'quick_meals';
  if (lower.includes('variet')) return 'meal_variety';
  if (lower.includes('waste')) return 'minimize_food_waste';
  if (lower.includes('trip')) return 'minimize_grocery_trips';
  if (lower.includes('quant') || lower.includes('yield') || lower.includes('portion')) return 'maximize_food_quantity';
  return lower;
}
