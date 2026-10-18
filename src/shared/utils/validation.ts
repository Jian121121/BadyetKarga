/** Lightweight input filters — number fields stay numbers, text fields stay text. */

/** Digits only (age, whole counts). */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/** Non-negative decimal (budget, price, quantity). One dot allowed. */
export function decimalOnly(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

export function isStrictDecimal(value: string, allowZero = true): boolean {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
  return allowZero || Number(trimmed) > 0;
}

export function isStrictInteger(value: string, allowZero = true): boolean {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return allowZero || Number(trimmed) > 0;
}

export const MEASUREMENT_UNITS = [
  'g', 'kg', 'ml', 'l', 'pc', 'pcs', 'pack', 'bundle', 'bunch', 'head',
  'block', 'can', 'cup', 'cups', 'tbsp', 'tsp',
  'clove', 'tali', 'bottle', 'sachet', 'dozen', 'slice', 'stalk',
] as const;

/** Units offered in pickers, with a short hint for the less obvious ones. */
export const UNIT_CHOICES: Array<{ unit: string; hint: string }> = [
  { unit: 'kg', hint: 'kilo' },
  { unit: 'g', hint: 'grams' },
  { unit: 'l', hint: 'liter' },
  { unit: 'ml', hint: 'milliliters' },
  { unit: 'pc', hint: 'piece' },
  { unit: 'clove', hint: 'garlic clove' },
  { unit: 'head', hint: 'garlic, cabbage' },
  { unit: 'bunch', hint: 'leafy greens' },
  { unit: 'tali', hint: 'market bundle' },
  { unit: 'stalk', hint: 'lemongrass, celery' },
  { unit: 'block', hint: 'tokwa' },
  { unit: 'pack', hint: 'noodles, mixes' },
  { unit: 'sachet', hint: 'seasoning' },
  { unit: 'can', hint: 'canned goods' },
  { unit: 'bottle', hint: 'sauces, oil' },
  { unit: 'dozen', hint: 'eggs' },
  { unit: 'slice', hint: 'bread, cheese' },
  { unit: 'cup', hint: 'cup' },
  { unit: 'tbsp', hint: 'tablespoon' },
  { unit: 'tsp', hint: 'teaspoon' },
];

export function unitOnly(value: string): string {
  return value.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

export function isMeasurementUnit(value: string): boolean {
  return (MEASUREMENT_UNITS as readonly string[]).includes(value.trim().toLowerCase());
}

export function isPantryQuantity(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'on hand') return true;
  const match = trimmed.match(/^(\d+(\.\d+)?)\s*([a-z]+)$/);
  return !!match && isMeasurementUnit(match[3]);
}

/** Person / dish names: letters, spaces, and common punctuation — no digits. */
export function nameTextOnly(value: string): string {
  return value.replace(/[0-9]/g, '');
}

/** Parse optional age years (1–120). Empty string allowed. */
export function parseAgeYears(value: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: '' };
  if (!/^\d{1,3}$/.test(trimmed)) {
    return { ok: false, error: 'Age must be a number (years).' };
  }
  const n = parseInt(trimmed, 10);
  if (n < 1 || n > 120) {
    return { ok: false, error: 'Age must be between 1 and 120.' };
  }
  return { ok: true, value: String(n) };
}
