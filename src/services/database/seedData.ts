import { Platform } from 'react-native';
import { db } from './db';

interface SeedIngredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
}

interface SeedDish {
  name: string;
  category: string;
  prepTimeMinutes: number;
  ingredients: SeedIngredient[];
}

const SEED_DISHES: SeedDish[] = [
  {
    name: 'Chicken Adobo', category: 'Main Dish', prepTimeMinutes: 45,
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'kg', price: 220, priority: 'high' },
      { name: 'Soy Sauce', quantity: 1, unit: 'bottle', price: 45, priority: 'high' },
      { name: 'Vinegar', quantity: 1, unit: 'bottle', price: 30, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Bay Leaves', quantity: 1, unit: 'pack', price: 10, priority: 'low' },
      { name: 'Black Pepper', quantity: 1, unit: 'pack', price: 15, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Sinigang na Baboy', category: 'Soup', prepTimeMinutes: 60,
    ingredients: [
      { name: 'Pork', quantity: 1, unit: 'kg', price: 350, priority: 'high' },
      { name: 'Kangkong', quantity: 1, unit: 'bundle', price: 30, priority: 'high' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Labanos', quantity: 2, unit: 'pc', price: 25, priority: 'medium' },
      { name: 'Talong', quantity: 2, unit: 'pc', price: 30, priority: 'medium' },
      { name: 'Kamatis', quantity: 3, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Sibuyas', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Siling Panigang', quantity: 3, unit: 'pc', price: 15, priority: 'low' },
      { name: 'Sinigang Mix', quantity: 1, unit: 'pack', price: 25, priority: 'high' },
      { name: 'Patis', quantity: 1, unit: 'bottle', price: 50, priority: 'medium' },
    ],
  },
  {
    name: 'Chicken Tinola', category: 'Soup', prepTimeMinutes: 40,
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'kg', price: 220, priority: 'high' },
      { name: 'Green Papaya', quantity: 1, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Ginger', quantity: 1, unit: 'pc', price: 15, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Malunggay Leaves', quantity: 1, unit: 'bundle', price: 15, priority: 'medium' },
      { name: 'Fish Sauce', quantity: 1, unit: 'bottle', price: 50, priority: 'medium' },
      { name: 'Black Pepper', quantity: 1, unit: 'pack', price: 15, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Pancit Bihon', category: 'Noodles', prepTimeMinutes: 35,
    ingredients: [
      { name: 'Bihon Noodles', quantity: 1, unit: 'pack', price: 60, priority: 'high' },
      { name: 'Chicken', quantity: 0.5, unit: 'kg', price: 110, priority: 'high' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Cabbage', quantity: 1, unit: 'pc', price: 30, priority: 'medium' },
      { name: 'Green Beans', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Soy Sauce', quantity: 1, unit: 'bottle', price: 45, priority: 'medium' },
      { name: 'Fish Sauce', quantity: 1, unit: 'bottle', price: 50, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
      { name: 'Black Pepper', quantity: 1, unit: 'pack', price: 15, priority: 'low' },
    ],
  },
  {
    name: 'Ginisang Ampalaya', category: 'Vegetables', prepTimeMinutes: 20,
    ingredients: [
      { name: 'Ampalaya', quantity: 2, unit: 'pc', price: 40, priority: 'high' },
      { name: 'Eggs', quantity: 3, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Kamatis', quantity: 2, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Sibuyas', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Fish Sauce', quantity: 1, unit: 'bottle', price: 50, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Beef Pares', category: 'Main Dish', prepTimeMinutes: 90,
    ingredients: [
      { name: 'Beef Brisket', quantity: 1, unit: 'kg', price: 420, priority: 'high' },
      { name: 'Soy Sauce', quantity: 1, unit: 'bottle', price: 45, priority: 'high' },
      { name: 'Brown Sugar', quantity: 1, unit: 'pack', price: 30, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Star Anise', quantity: 1, unit: 'pack', price: 20, priority: 'low' },
      { name: 'Green Onion', quantity: 1, unit: 'bundle', price: 15, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Tapsilog', category: 'Breakfast', prepTimeMinutes: 25,
    ingredients: [
      { name: 'Beef Tapa', quantity: 0.5, unit: 'kg', price: 180, priority: 'high' },
      { name: 'Garlic Rice', quantity: 2, unit: 'cups', price: 30, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pc', price: 20, priority: 'high' },
      { name: 'Vinegar', quantity: 1, unit: 'bottle', price: 30, priority: 'low' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Tocilog', category: 'Breakfast', prepTimeMinutes: 20,
    ingredients: [
      { name: 'Pork Tocino', quantity: 0.5, unit: 'kg', price: 150, priority: 'high' },
      { name: 'Garlic Rice', quantity: 2, unit: 'cups', price: 30, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pc', price: 20, priority: 'high' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Pinakbet', category: 'Vegetables', prepTimeMinutes: 30,
    ingredients: [
      { name: 'Pork', quantity: 0.3, unit: 'kg', price: 105, priority: 'medium' },
      { name: 'Squash', quantity: 1, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Okra', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Eggplant', quantity: 2, unit: 'pc', price: 30, priority: 'medium' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Bagoong', quantity: 1, unit: 'pack', price: 35, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Tomato', quantity: 2, unit: 'pc', price: 15, priority: 'low' },
    ],
  },
  {
    name: 'Beef Caldereta', category: 'Main Dish', prepTimeMinutes: 90,
    ingredients: [
      { name: 'Beef', quantity: 1, unit: 'kg', price: 420, priority: 'high' },
      { name: 'Potato', quantity: 2, unit: 'pc', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 2, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Bell Pepper', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
      { name: 'Tomato Sauce', quantity: 1, unit: 'can', price: 35, priority: 'high' },
      { name: 'Liver Spread', quantity: 1, unit: 'can', price: 45, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cheese', quantity: 1, unit: 'pack', price: 60, priority: 'low' },
    ],
  },
  {
    name: 'Pork Menudo', category: 'Main Dish', prepTimeMinutes: 50,
    ingredients: [
      { name: 'Pork', quantity: 0.5, unit: 'kg', price: 175, priority: 'high' },
      { name: 'Pork Liver', quantity: 0.25, unit: 'kg', price: 60, priority: 'medium' },
      { name: 'Potato', quantity: 2, unit: 'pc', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 2, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Tomato Sauce', quantity: 1, unit: 'can', price: 35, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Bell Pepper', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
    ],
  },
  {
    name: 'Beef Kare-Kare', category: 'Main Dish', prepTimeMinutes: 120,
    ingredients: [
      { name: 'Oxtail', quantity: 1, unit: 'kg', price: 380, priority: 'high' },
      { name: 'Peanut Butter', quantity: 1, unit: 'pack', price: 65, priority: 'high' },
      { name: 'Eggplant', quantity: 2, unit: 'pc', price: 30, priority: 'medium' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Banana Heart', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
      { name: 'Bagoong', quantity: 1, unit: 'pack', price: 35, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Chopsuey', category: 'Vegetables', prepTimeMinutes: 25,
    ingredients: [
      { name: 'Chicken', quantity: 0.3, unit: 'kg', price: 66, priority: 'medium' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'high' },
      { name: 'Cabbage', quantity: 1, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Cauliflower', quantity: 1, unit: 'pc', price: 40, priority: 'medium' },
      { name: 'Snow Peas', quantity: 1, unit: 'pack', price: 35, priority: 'low' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 1, unit: 'bottle', price: 60, priority: 'medium' },
    ],
  },
  {
    name: 'Bulalo', category: 'Soup', prepTimeMinutes: 150,
    ingredients: [
      { name: 'Beef Shank', quantity: 1, unit: 'kg', price: 400, priority: 'high' },
      { name: 'Corn', quantity: 2, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Cabbage', quantity: 1, unit: 'pc', price: 30, priority: 'medium' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Pechay', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Patis', quantity: 1, unit: 'bottle', price: 50, priority: 'low' },
    ],
  },
];

export function seedDishes() {
  if (Platform.OS === 'web') return;

  const count = db!.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM dishes;`);
  if (count && count.count > 0) return;

  for (const dish of SEED_DISHES) {
    const result = db!.runSync(
      `INSERT INTO dishes (name, category, estimatedCost, prepTimeMinutes) VALUES (?, ?, ?, ?);`,
      [dish.name, dish.category, dish.ingredients.reduce((s, i) => s + i.price, 0), dish.prepTimeMinutes]
    );
    const dishId = result.lastInsertRowId;
    for (const ing of dish.ingredients) {
      db!.runSync(
        `INSERT INTO dish_ingredients (dishId, ingredientName, quantity, unit, estimatedPrice, priority) VALUES (?, ?, ?, ?, ?, ?);`,
        [dishId, ing.name, ing.quantity, ing.unit, ing.price, ing.priority]
      );
    }
  }
}