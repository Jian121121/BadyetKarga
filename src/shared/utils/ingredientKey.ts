/** Common English / Tagalog names mapped to the names used in recipes. */
const ALIASES: Record<string, string> = {
  pepper: 'black pepper',
  paminta: 'black pepper',
  oil: 'cooking oil',
  mantika: 'cooking oil',
  'vegetable oil': 'cooking oil',
  'brown sugar': 'sugar',
  'white sugar': 'sugar',
  asukal: 'sugar',
  bawang: 'garlic',
  sibuyas: 'onion',
  'red onion': 'onion',
  'white onion': 'onion',
  toyo: 'soy sauce',
  suka: 'vinegar',
  asin: 'salt',
  itlog: 'egg',
  bigas: 'rice',
  kanin: 'rice',
  luya: 'ginger',
  kamatis: 'tomato',
  patis: 'fish sauce',
  harina: 'flour',
  gatas: 'milk',
};

function singular(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Normalized key so "Eggs", "egg", and "Itlog" all match the same pantry item. */
export function ingredientKey(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const aliased = ALIASES[cleaned] ?? cleaned;
  const words = aliased.split(' ');
  words[words.length - 1] = singular(words[words.length - 1]);
  const key = words.join(' ');
  return ALIASES[key] ?? key;
}

/** "pcs" → "pc", "cups" → "cup", "heads" → "head". */
export function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase().replace(/\.$/, '');
  if (u === 'pieces' || u === 'piece') return 'pc';
  if (/(ch|sh|x)es$/.test(u)) return u.slice(0, -2);
  if (u.length >= 3 && u.endsWith('s') && !u.endsWith('ss')) return u.slice(0, -1);
  return u;
}
