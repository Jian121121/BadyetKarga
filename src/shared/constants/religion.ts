export const RELIGION_OPTIONS = [
  'No Religious Restriction',
  'Roman Catholic',
  'Iglesia ni Cristo',
  'Islam',
  'Judaism',
  'Seventh-day Adventist',
  'Other',
  'Custom',
] as const;

export type ReligionOption = (typeof RELIGION_OPTIONS)[number];

export const RELIGION_DESCRIPTIONS: Record<string, string> = {
  'No Religious Restriction': 'No dietary restrictions applied to recommendations.',
  'Roman Catholic': 'Meatless Fridays during Lent (fish and vegetable dishes only on those days).',
  'Iglesia ni Cristo': 'Restricts dishes prepared with animal blood (e.g., Dinuguan).',
  'Islam': 'Halal guidelines; avoids pork, pork-derived ingredients, and blood.',
  'Judaism': 'Kosher considerations; avoids pork, shellfish (incl. bagoong), and blood.',
  'Seventh-day Adventist': 'Clean-meat preference; avoids pork and shellfish (incl. bagoong).',
  'Other': 'Another faith: tick or type the foods your religion avoids below.',
  'Custom': 'Personal, health, or cultural choice: tick or type exactly which foods to avoid below.',
};

/** Religions whose restrictions come from the household's own avoid-list. */
export function usesCustomFoodRestrictions(religion: string | null | undefined): boolean {
  return religion === 'Other' || religion === 'Custom';
}

/** How to name the rule set in warnings, e.g. "Islam" or "your foods-to-avoid list". */
export function restrictionSourceLabel(religion: string | null | undefined): string {
  return usesCustomFoodRestrictions(religion) ? 'your foods-to-avoid list' : religion ?? '';
}

export type FoodRestrictionKey =
  | 'pork'
  | 'beef'
  | 'chicken'
  | 'fish'
  | 'shellfish'
  | 'blood'
  | 'all_meat';

export const FOOD_RESTRICTION_OPTIONS: Array<{ key: FoodRestrictionKey; label: string; hint: string }> = [
  { key: 'pork', label: 'Pork', hint: 'Baboy, tocino, longganisa, liver spread' },
  { key: 'beef', label: 'Beef', hint: 'Baka, tapa, corned beef, oxtail' },
  { key: 'chicken', label: 'Chicken', hint: 'Manok, tinola, arroz caldo' },
  { key: 'fish', label: 'Fish', hint: 'Bangus, sardinas, patis / fish sauce' },
  { key: 'shellfish', label: 'Shellfish', hint: 'Hipon, alimango, bagoong' },
  { key: 'blood', label: 'Animal blood', hint: 'Dinuguan, pork blood' },
  { key: 'all_meat', label: 'All meat & seafood (vegetarian)', hint: 'Only vegetable and egg dishes' },
];

interface DishFacts {
  name: string;
  category: string;
  ingredients: string[];
}

const MATCHERS: Record<Exclude<FoodRestrictionKey, 'all_meat'>, { categories: string[]; pattern: RegExp }> = {
  pork: {
    categories: ['pork'],
    pattern:
      /\bpork\b|baboy|tocino|tocilog|longganisa|longsilog|bacon|\bham\b|menudo|bicol express|dinuguan|lechon|sisig|liempo|chicharon|liver spread/,
  },
  beef: {
    categories: ['beef'],
    pattern: /\bbeef\b|baka|bulalo|tapa\b|tapsilog|kare-kare|oxtail|pares|corned/,
  },
  chicken: {
    categories: ['chicken'],
    pattern: /chicken|manok|tinola|arroz caldo/,
  },
  fish: {
    categories: [],
    pattern: /\bfish\b|bangus|tilapia|galunggong|tuna|sardin|dilis|tuyo|daing|patis/,
  },
  shellfish: {
    categories: [],
    pattern: /shrimp|hipon|prawn|crab|alimango|alimasag|bagoong|squid|pusit|tahong|mussel|halaan|clam|talaba|oyster|shellfish/,
  },
  blood: {
    categories: [],
    pattern: /blood|dinuguan/,
  },
};

function matches(dish: DishFacts, key: FoodRestrictionKey): boolean {
  if (key === 'all_meat') {
    return (['pork', 'beef', 'chicken', 'fish', 'shellfish'] as const).some((k) => matches(dish, k));
  }
  const { categories, pattern } = MATCHERS[key];
  const category = dish.category.toLowerCase();
  if (categories.includes(category)) return true;
  if (pattern.test(dish.name.toLowerCase())) return true;
  return dish.ingredients.some((i) => pattern.test(i.toLowerCase()));
}

const RELIGION_RULES: Array<{ test: RegExp; avoid: FoodRestrictionKey[] }> = [
  { test: /iglesia|\binc\b/, avoid: ['blood'] },
  { test: /islam|halal|muslim/, avoid: ['pork', 'blood'] },
  { test: /judaism|jewish|kosher/, avoid: ['pork', 'shellfish', 'blood'] },
  { test: /adventist|\bsda\b/, avoid: ['pork', 'shellfish'] },
];

/**
 * Stored shape of `customFoodRestrictions`:
 * `{ "keys": FoodRestrictionKey[], "terms": string[] }` (legacy: a bare keys array).
 * `terms` are foods the household typed in themselves, e.g. "mushroom", "peanut".
 */
function parseStored(raw: string | null | undefined): { keys: unknown[]; terms: unknown[] } {
  if (!raw) return { keys: [], terms: [] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { keys: parsed, terms: [] };
    if (parsed && typeof parsed === 'object') {
      return {
        keys: Array.isArray(parsed.keys) ? parsed.keys : [],
        terms: Array.isArray(parsed.terms) ? parsed.terms : [],
      };
    }
  } catch {
    // ignore
  }
  return { keys: [], terms: [] };
}

export function parseCustomFoodRestrictions(raw: string | null | undefined): FoodRestrictionKey[] {
  const valid = new Set<string>(FOOD_RESTRICTION_OPTIONS.map((o) => o.key));
  return parseStored(raw).keys.filter((k): k is FoodRestrictionKey => typeof k === 'string' && valid.has(k));
}

export function parseCustomFoodTerms(raw: string | null | undefined): string[] {
  return normalizeFoodTerms(parseStored(raw).terms.filter((t): t is string => typeof t === 'string'));
}

export function serializeCustomFoodRestrictions(keys: FoodRestrictionKey[], terms: string[]): string {
  return JSON.stringify({ keys, terms: normalizeFoodTerms(terms) });
}

/** Trim, lowercase, de-duplicate; drops blanks and anything under 2 characters. */
export function normalizeFoodTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  for (const term of terms) {
    const t = term.trim().toLowerCase().replace(/\s+/g, ' ');
    if (t.length >= 2) seen.add(t);
  }
  return [...seen];
}

/** Splits free text like "mushroom, peanuts; ampalaya" into separate foods. */
export function splitFoodTerms(text: string): string[] {
  return normalizeFoodTerms(text.split(/[,;\n]+/));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word match on the dish name or any ingredient, tolerant of a plural "s"/"es". */
function matchesTerm(dish: DishFacts, term: string): boolean {
  const stem = term.replace(/(es|s)$/, '');
  const base = stem.length >= 3 ? stem : term;
  const pattern = new RegExp(`(^|[^a-z])${escapeRegExp(base)}(e?s)?($|[^a-z])`);
  if (pattern.test(dish.name.toLowerCase())) return true;
  return dish.ingredients.some((i) => pattern.test(i.toLowerCase()));
}

/**
 * Checks if a dish conflicts with the household's religion / custom food rules.
 * Meal-specific exceptions override this restriction in the planning engine.
 * Roman Catholic Lent Fridays are slot-specific; see isMeatlessDay().
 */
export function isDishRestrictedByReligion(
  dishName: string,
  category: string,
  ingredientNames: string[],
  religion: string | null | undefined,
  customFoodRestrictions: FoodRestrictionKey[] = [],
  customFoodTerms: string[] = []
): boolean {
  if (!religion || religion === 'No Religious Restriction') return false;
  const dish: DishFacts = { name: dishName, category, ingredients: ingredientNames };

  if (usesCustomFoodRestrictions(religion)) {
    return (
      customFoodRestrictions.some((key) => matches(dish, key)) ||
      customFoodTerms.some((term) => matchesTerm(dish, term))
    );
  }

  const rel = religion.toLowerCase();
  const rule = RELIGION_RULES.find((r) => r.test.test(rel));
  return rule ? rule.avoid.some((key) => matches(dish, key)) : false;
}

/** Pork, beef, or chicken. Fish and seafood are allowed on meatless days. */
export function isMeatDish(dishName: string, category: string, ingredientNames: string[]): boolean {
  const dish: DishFacts = { name: dishName, category, ingredients: ingredientNames };
  return matches(dish, 'pork') || matches(dish, 'beef') || matches(dish, 'chicken');
}

/** Easter Sunday (Gregorian, anonymous algorithm). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Roman Catholic: Fridays from Ash Wednesday to Holy Saturday are meatless. */
export function isMeatlessDay(religion: string | null | undefined, date: Date): boolean {
  if (!religion || !/catholic/i.test(religion)) return false;
  if (date.getDay() !== 5) return false;
  const easter = easterSunday(date.getFullYear());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const ashWednesday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 46).getTime();
  return day >= ashWednesday && day < easter.getTime();
}
