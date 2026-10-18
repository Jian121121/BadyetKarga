/** Shared family / allergy / availability constants used by Setup Wizard and Profile. */

export const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'] as const;
export const GENDERS = ['Male', 'Female', 'Other'] as const;

export const ALLERGY_OPTIONS = [
  'Shrimp',
  'Crab',
  'Shellfish',
  'Milk',
  'Egg',
  'Peanut',
  'Soy',
  'Gluten',
  'Fish',
] as const;

export const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Low Sodium',
  'Low Sugar',
  'Diabetic Friendly',
] as const;

export const COMMON_PANTRY_INGREDIENTS = [
  'Rice',
  'Salt',
  'Pepper',
  'Garlic',
  'Onion',
  'Soy Sauce',
  'Vinegar',
  'Cooking Oil',
  'Sugar',
  'Flour',
  'Eggs',
  'Milk',
] as const;
