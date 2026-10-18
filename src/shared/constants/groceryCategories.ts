import type { MaterialIcons } from '@expo/vector-icons';

/** Market sections in the order a typical palengke / supermarket run goes. */
export const GROCERY_CATEGORIES = [
  { name: 'Meat', icon: 'set-meal' },
  { name: 'Fish & Seafood', icon: 'phishing' },
  { name: 'Vegetables & Fruits', icon: 'eco' },
  { name: 'Eggs, Dairy & Tofu', icon: 'egg-alt' },
  { name: 'Rice, Noodles & Bread', icon: 'rice-bowl' },
  { name: 'Canned & Dry Goods', icon: 'inventory-2' },
  { name: 'Condiments & Spices', icon: 'local-dining' },
  { name: 'Others', icon: 'shopping-basket' },
] as const satisfies ReadonlyArray<{ name: string; icon: keyof typeof MaterialIcons.glyphMap }>;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]['name'];

/** Checked in order: the first match wins, so specific phrases come before broad words. */
const RULES: Array<[GroceryCategory, RegExp]> = [
  [
    'Canned & Dry Goods',
    /canned|\bcan\b|corned|sardin|spam|luncheon|vienna|pork and beans|coconut milk|coconut cream|\bgata\b|monggo|mung bean|dried (?!fish)|raisin|peanut|mani\b/,
  ],
  [
    'Condiments & Spices',
    /sauce|\bsoy\b|toyo|vinegar|suka|patis|bagoong|shrimp paste|\bpaste\b|ketchup|catsup|mayonnaise|\boil\b|mantika|\bsalt\b|\basin\b|sugar|asukal|\bmsg\b|seasoning|bouillon|\bcube\b|granules|sinigang mix|\bmix\b|^pepper$|black pepper|ground pepper|white pepper|peppercorn|paminta|bay lea|laurel|paprika|curry|annatto|atsuete|achuete|star anise|cinnamon|vetsin/,
  ],
  ['Eggs, Dairy & Tofu', /\beggs?\b|itlog|milk|gatas|cheese|butter|cream|evaporated|condensed|tokwa|tofu|taho/],
  [
    'Fish & Seafood',
    /fish|bangus|tilapia|galunggong|\bgg\b|tuna|salmon|shrimp|hipon|prawn|squid|pusit|crab|alimango|alimasag|mussel|tahong|clam|halaan|tuyo|dilis|daing|tinapa|lapu|maya-maya|tamban/,
  ],
  [
    'Meat',
    /chicken|manok|pork|baboy|beef|baka|liempo|kasim|pigue|tapa|tocino|longganisa|longanisa|hotdog|bacon|\bham\b|oxtail|shank|liver|atay|giniling|ground (pork|beef|meat|chicken)|chorizo|meat|lechon|bulalo|tripe|tuwalya/,
  ],
  [
    'Rice, Noodles & Bread',
    /\brice\b|bigas|malagkit|glutinous|noodle|pancit|bihon|canton|sotanghon|miki|misua|spaghetti|pasta|macaroni|flour|harina|cornstarch|bread|pandesal|tasty|oats|lumpia wrapper|wrapper/,
  ],
  [
    'Vegetables & Fruits',
    /onion|sibuyas|garlic|bawang|ginger|luya|tomato|kamatis|potato|patatas|carrot|cabbage|repolyo|pechay|bok choy|kangkong|spinach|sitaw|string bean|talong|eggplant|ampalaya|bitter gourd|okra|squash|kalabasa|sayote|chayote|upo|malunggay|moringa|gabi|taro|labanos|radish|mustasa|lettuce|bell pepper|chili|\bsili\b|siling|lemongrass|tanglad|calamansi|kalamansi|lemon|banana|saba|mango|papaya|togue|bean sprout|mushroom|\bcorn\b|peas|green beans|baguio beans|spring onion|leek|celery|cucumber|pipino|langka|jackfruit|coconut|niyog|singkamas|camote|kamote|ube|alugbati|saluyot|dahon|leaves|cilantro|wansoy|parsley|broccoli|cauliflower|pineapple|apple|orange/,
  ],
];

export function categorizeIngredient(name: string): GroceryCategory {
  const n = name.toLowerCase();
  for (const [category, pattern] of RULES) {
    if (pattern.test(n)) return category;
  }
  return 'Others';
}

export function categoryIcon(name: string): keyof typeof MaterialIcons.glyphMap {
  return GROCERY_CATEGORIES.find((c) => c.name === name)?.icon ?? 'shopping-basket';
}
