import type { ImageSourcePropType } from 'react-native';

/** Per-dish image overrides for accurate dish identification */
const DISH_OVERRIDES: Record<string, ImageSourcePropType> = {
  'Chicken Adobo': require('../../../assets/dishes/dish-chicken.png'),
  'Chicken Tinola': require('../../../assets/dishes/dish-soup.png'),
  'Chicken Curry': require('../../../assets/dishes/dish-chicken.png'),
  'Sinigang na Baboy': require('../../../assets/dishes/dish-soup.png'),
  'Sinigang na Hipon': require('../../../assets/dishes/dish-fish.png'),
  'Bulalo': require('../../../assets/dishes/dish-beef.png'),
  'Beef Pares': require('../../../assets/dishes/dish-beef.png'),
  'Beef Caldereta': require('../../../assets/dishes/dish-beef.png'),
  'Beef Kare-Kare': require('../../../assets/dishes/dish-beef.png'),
  'Pork Menudo': require('../../../assets/dishes/dish-pork.png'),
  'Pork Giniling': require('../../../assets/dishes/dish-pork.png'),
  'Bicol Express': require('../../../assets/dishes/dish-pork.png'),
  'Dinuguan': require('../../../assets/dishes/dish-pork.png'),
  'Pancit Bihon': require('../../../assets/dishes/dish-noodles.png'),
  'Ginisang Monggo': require('../../../assets/dishes/dish-vegetables.png'),
  'Ginisang Ampalaya': require('../../../assets/dishes/dish-vegetables.png'),
  'Pinakbet': require('../../../assets/dishes/dish-vegetables.png'),
  'Chopsuey': require('../../../assets/dishes/dish-vegetables.png'),
  'Tortang Talong': require('../../../assets/dishes/dish-vegetables.png'),
  'Ginataang Gulay': require('../../../assets/dishes/dish-vegetables.png'),
  'Tapsilog': require('../../../assets/dishes/dish-breakfast.png'),
  'Tocilog': require('../../../assets/dishes/dish-breakfast.png'),
  'Longsilog': require('../../../assets/dishes/dish-breakfast.png'),
  'Corned Beef Guisado': require('../../../assets/dishes/dish-breakfast.png'),
  'Arroz Caldo': require('../../../assets/dishes/dish-soup.png'),
  'Champorado': require('../../../assets/dishes/dish-breakfast.png'),
  'Ginisang Sardinas': require('../../../assets/dishes/dish-fish.png'),
  'Fried Bangus': require('../../../assets/dishes/dish-fish.png'),
  'Turon': require('../../../assets/dishes/dish-snack.png'),
  'Banana Cue': require('../../../assets/dishes/dish-snack.png'),
  'Lumpiang Gulay': require('../../../assets/dishes/dish-snack.png'),
};

const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  Breakfast: require('../../../assets/dishes/dish-breakfast.png'),
  Chicken: require('../../../assets/dishes/dish-chicken.png'),
  Pork: require('../../../assets/dishes/dish-pork.png'),
  Beef: require('../../../assets/dishes/dish-beef.png'),
  'Fish & Seafood': require('../../../assets/dishes/dish-fish.png'),
  Vegetables: require('../../../assets/dishes/dish-vegetables.png'),
  Noodles: require('../../../assets/dishes/dish-noodles.png'),
  Snack: require('../../../assets/dishes/dish-snack.png'),
  Soup: require('../../../assets/dishes/dish-soup.png'),
};

const NEUTRAL_FALLBACK: ImageSourcePropType = require('../../../assets/wizard/meal-mixed.png');

export function imageForDish(
  dishName: string,
  category: string,
  imageUri?: string | null
): ImageSourcePropType {
  if (imageUri) return { uri: imageUri };
  return DISH_OVERRIDES[dishName] ?? CATEGORY_IMAGES[category] ?? NEUTRAL_FALLBACK;
}

export const DISH_CATEGORIES = [
  'All',
  'Breakfast',
  'Chicken',
  'Pork',
  'Beef',
  'Fish & Seafood',
  'Vegetables',
  'Soup',
  'Noodles',
  'Snack',
  'Dessert',
] as const;
