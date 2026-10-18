/**
 * Filters dishes that contain any family-member allergen.
 * Matches against dish name and ingredient names (case-insensitive),
 * including common Filipino/English synonym pairs (e.g. shrimp ↔ hipon).
 */

const ALLERGEN_SYNONYMS: Record<string, string[]> = {
  shrimp: ['shrimp', 'hipon', 'prawn'],
  hipon: ['shrimp', 'hipon', 'prawn'],
  prawn: ['shrimp', 'hipon', 'prawn'],
  peanut: ['peanut', 'mani', 'peanuts'],
  mani: ['peanut', 'mani', 'peanuts'],
  fish: ['fish', 'bangus', 'tilapia', 'galunggong'],
  crab: ['crab', 'alimango', 'alimasag'],
  shellfish: ['shellfish', 'shrimp', 'hipon', 'crab', 'alimango', 'mussel', 'tahong'],
  egg: ['egg', 'eggs'],
  milk: ['milk', 'dairy', 'cheese'],
  soy: ['soy', 'soya', 'tofu'],
};

function expandAllergen(token: string): string[] {
  const key = token.toLowerCase().trim();
  if (!key) return [];
  return ALLERGEN_SYNONYMS[key] ?? [key];
}

/** Parse free-text allergy fields (comma/semicolon separated) into unique tokens. */
export function collectAllergies(members: { allergies: string }[]): string[] {
  const tokens = new Set<string>();
  for (const member of members) {
    if (!member.allergies?.trim()) continue;
    for (const part of member.allergies.split(/[,;/|]+/)) {
      const trimmed = part.trim().toLowerCase();
      if (trimmed) tokens.add(trimmed);
    }
  }
  return [...tokens];
}

export function collectDietaryRestrictions(members: { dietaryRestrictions: string }[]): string[] {
  const tokens = new Set<string>();
  for (const member of members) {
    if (!member.dietaryRestrictions?.trim()) continue;
    for (const part of member.dietaryRestrictions.split(/[,;/|]+/)) {
      const trimmed = part.trim().toLowerCase();
      if (trimmed) tokens.add(trimmed);
    }
  }
  return [...tokens];
}

/** Hard-filter only restrictions with explicit ingredient or dish-tag rules. */
export function dishViolatesDietaryRestriction(
  dishName: string,
  ingredientNames: string[],
  tags: string,
  restrictions: string[]
): boolean {
  if (restrictions.length === 0) return false;
  const text = `${dishName} ${ingredientNames.join(' ')} ${tags}`.toLowerCase();
  return restrictions.some((restriction) => {
    if (restriction.includes('vegan')) return /pork|beef|chicken|meat|fish|shrimp|crab|egg|milk|cheese|butter|dairy|seafood/.test(text);
    if (restriction.includes('vegetarian')) return /pork|beef|chicken|meat|fish|shrimp|crab|seafood|bangus|tilapia/.test(text);
    if (restriction.includes('halal')) return /pork|bacon|ham|alcohol|wine|beer|rum/.test(text);
    if (restriction.includes('low sodium')) return /bagoong|patis|fish sauce|soy sauce|salted|salt/.test(text) && !/low sodium/.test(text);
    if (restriction.includes('low sugar') || restriction.includes('diabetic')) return /sugar|sweetened|syrup|candy|dessert/.test(text) && !/low sugar|diabetic/.test(text);
    return false;
  });
}

function textMatchesAllergen(text: string, allergenTokens: string[]): boolean {
  const haystack = text.toLowerCase();
  for (const token of allergenTokens) {
    for (const synonym of expandAllergen(token)) {
      // Word-boundary match so "egg" does not hit "eggplant"
      const pattern = new RegExp(`(?:^|[^a-z])${escapeRegExp(synonym)}(?:[^a-z]|$)`, 'i');
      if (pattern.test(haystack)) return true;
    }
  }
  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function dishContainsAllergen(
  dishName: string,
  ingredientNames: string[],
  allergies: string[]
): boolean {
  if (allergies.length === 0) return false;
  if (textMatchesAllergen(dishName, allergies)) return true;
  return ingredientNames.some((name) => textMatchesAllergen(name, allergies));
}

export function filterDishesByAllergies<T extends { id: number; name: string }>(
  dishes: T[],
  ingredientsByDishId: Map<number, string[]>,
  allergies: string[]
): T[] {
  if (allergies.length === 0) return dishes;
  return dishes.filter((dish) => {
    const ingredients = ingredientsByDishId.get(dish.id) ?? [];
    return !dishContainsAllergen(dish.name, ingredients, allergies);
  });
}
