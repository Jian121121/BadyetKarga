import { Platform } from 'react-native';
import { db } from './db';

export interface SeedIngredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SeedDish {
  name: string;
  category: string;
  /** Comma-joined meal types this dish suits: breakfast, lunch, snack, dinner */
  mealTypes: string;
  prepTimeMinutes: number;
  servings: number;
  /** Comma-joined style tags matching the setup-wizard meal styles */
  tags: string;
  description: string;
  ingredients: SeedIngredient[];
}

// Style tag vocabulary (matches wizard "Meal Style" choices):
//   Budget Friendly · Healthy · Traditional Filipino · Quick Meals · Family Favorite
export const SEED_DISHES: SeedDish[] = [
  {
    name: 'Chicken Adobo', category: 'Chicken', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 45, servings: 4, tags: 'Traditional Filipino,Family Favorite,Budget Friendly',
    description: 'A classic Filipino stew of chicken marinated in soy sauce, vinegar, and garlic. Savory, sour, and even better as leftovers.',
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'kg', price: 220, priority: 'high' },
      { name: 'Soy Sauce', quantity: 0.5, unit: 'cup', price: 20, priority: 'high' },
      { name: 'Vinegar', quantity: 0.25, unit: 'cup', price: 10, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Bay Leaves', quantity: 2, unit: 'pcs', price: 10, priority: 'low' },
      { name: 'Black Pepper', quantity: 1, unit: 'tsp', price: 5, priority: 'low' },
      { name: 'Cooking Oil', quantity: 0.25, unit: 'cup', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Sinigang na Baboy', category: 'Pork', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 60, servings: 5, tags: 'Traditional Filipino,Family Favorite',
    description: 'Sour tamarind pork soup loaded with kangkong, radish, and vegetables — comfort in a bowl.',
    ingredients: [
      { name: 'Pork', quantity: 1, unit: 'kg', price: 350, priority: 'high' },
      { name: 'Kangkong', quantity: 1, unit: 'bundle', price: 30, priority: 'high' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Labanos', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Talong', quantity: 2, unit: 'pcs', price: 30, priority: 'medium' },
      { name: 'Kamatis', quantity: 3, unit: 'pcs', price: 20, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Siling Panigang', quantity: 3, unit: 'pcs', price: 15, priority: 'low' },
      { name: 'Sinigang Mix', quantity: 1, unit: 'pack', price: 25, priority: 'high' },
      { name: 'Patis', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Chicken Tinola', category: 'Chicken', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 40, servings: 4, tags: 'Healthy,Traditional Filipino,Budget Friendly',
    description: 'Light ginger chicken soup with green papaya and malunggay — a healthy family staple.',
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'kg', price: 220, priority: 'high' },
      { name: 'Green Papaya', quantity: 1, unit: 'pc', price: 30, priority: 'high' },
      { name: 'Ginger', quantity: 1, unit: 'pc', price: 15, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Malunggay Leaves', quantity: 1, unit: 'bundle', price: 15, priority: 'medium' },
      { name: 'Fish Sauce', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Sinigang na Hipon', category: 'Fish & Seafood', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 40, servings: 4, tags: 'Healthy,Traditional Filipino',
    description: 'Sour shrimp soup with tamarind broth and fresh vegetables.',
    ingredients: [
      { name: 'Shrimp', quantity: 0.5, unit: 'kg', price: 280, priority: 'high' },
      { name: 'Kangkong', quantity: 1, unit: 'bundle', price: 30, priority: 'high' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Labanos', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Kamatis', quantity: 3, unit: 'pcs', price: 20, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Sinigang Mix', quantity: 1, unit: 'pack', price: 25, priority: 'high' },
    ],
  },
  {
    name: 'Pancit Bihon', category: 'Noodles', mealTypes: 'lunch,snack,dinner',
    prepTimeMinutes: 35, servings: 6, tags: 'Budget Friendly,Traditional Filipino,Family Favorite',
    description: 'Stir-fried rice noodles with chicken and crisp vegetables — feeds the whole family.',
    ingredients: [
      { name: 'Bihon Noodles', quantity: 1, unit: 'pack', price: 60, priority: 'high' },
      { name: 'Chicken', quantity: 0.5, unit: 'kg', price: 110, priority: 'high' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Cabbage', quantity: 0.5, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Green Beans', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Soy Sauce', quantity: 0.25, unit: 'cup', price: 10, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 0.25, unit: 'cup', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Ginisang Ampalaya', category: 'Vegetables', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 20, servings: 3, tags: 'Healthy,Budget Friendly,Quick Meals',
    description: 'Bitter melon sautéed with egg, tomato, and garlic. Cheap, fast, and good for you.',
    ingredients: [
      { name: 'Ampalaya', quantity: 2, unit: 'pcs', price: 40, priority: 'high' },
      { name: 'Eggs', quantity: 3, unit: 'pcs', price: 30, priority: 'high' },
      { name: 'Kamatis', quantity: 2, unit: 'pcs', price: 15, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Fish Sauce', quantity: 1, unit: 'tbsp', price: 5, priority: 'low' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Beef Pares', category: 'Beef', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 90, servings: 4, tags: 'Family Favorite,Traditional Filipino',
    description: 'Sweet-savory braised beef brisket served with garlic rice and clear soup.',
    ingredients: [
      { name: 'Beef Brisket', quantity: 1, unit: 'kg', price: 420, priority: 'high' },
      { name: 'Soy Sauce', quantity: 0.5, unit: 'cup', price: 20, priority: 'high' },
      { name: 'Brown Sugar', quantity: 0.25, unit: 'cup', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Star Anise', quantity: 3, unit: 'pcs', price: 15, priority: 'low' },
      { name: 'Green Onion', quantity: 1, unit: 'bundle', price: 15, priority: 'low' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Tapsilog', category: 'Breakfast', mealTypes: 'breakfast',
    prepTimeMinutes: 25, servings: 2, tags: 'Family Favorite,Quick Meals,Traditional Filipino',
    description: 'Marinated beef tapa with garlic rice and a sunny-side-up egg — the classic silog.',
    ingredients: [
      { name: 'Beef Tapa', quantity: 0.5, unit: 'kg', price: 180, priority: 'high' },
      { name: 'Rice', quantity: 2, unit: 'cups', price: 25, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pcs', price: 20, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 3, unit: 'tbsp', price: 12, priority: 'medium' },
    ],
  },
  {
    name: 'Tocilog', category: 'Breakfast', mealTypes: 'breakfast',
    prepTimeMinutes: 20, servings: 2, tags: 'Budget Friendly,Quick Meals',
    description: 'Sweet cured pork tocino with garlic rice and fried egg.',
    ingredients: [
      { name: 'Pork Tocino', quantity: 0.5, unit: 'kg', price: 150, priority: 'high' },
      { name: 'Rice', quantity: 2, unit: 'cups', price: 25, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pcs', price: 20, priority: 'high' },
      { name: 'Cooking Oil', quantity: 3, unit: 'tbsp', price: 12, priority: 'medium' },
    ],
  },
  {
    name: 'Pinakbet', category: 'Vegetables', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 30, servings: 4, tags: 'Healthy,Budget Friendly,Traditional Filipino',
    description: 'Ilocano mixed vegetables with squash, okra, and bagoong.',
    ingredients: [
      { name: 'Pork', quantity: 0.3, unit: 'kg', price: 105, priority: 'medium' },
      { name: 'Squash', quantity: 0.5, unit: 'pc', price: 25, priority: 'high' },
      { name: 'Okra', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Talong', quantity: 2, unit: 'pcs', price: 30, priority: 'medium' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Bagoong', quantity: 2, unit: 'tbsp', price: 15, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Kamatis', quantity: 2, unit: 'pcs', price: 15, priority: 'low' },
    ],
  },
  {
    name: 'Beef Caldereta', category: 'Beef', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 90, servings: 5, tags: 'Family Favorite,Traditional Filipino',
    description: 'Rich tomato beef stew with potatoes, carrots, and cheese — fiesta food.',
    ingredients: [
      { name: 'Beef', quantity: 1, unit: 'kg', price: 420, priority: 'high' },
      { name: 'Potato', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 2, unit: 'pcs', price: 20, priority: 'medium' },
      { name: 'Bell Pepper', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
      { name: 'Tomato Sauce', quantity: 1, unit: 'can', price: 35, priority: 'high' },
      { name: 'Liver Spread', quantity: 1, unit: 'can', price: 45, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cheese', quantity: 0.25, unit: 'block', price: 25, priority: 'low' },
    ],
  },
  {
    name: 'Pork Menudo', category: 'Pork', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 50, servings: 4, tags: 'Budget Friendly,Family Favorite,Traditional Filipino',
    description: 'Diced pork and liver in tomato sauce with potatoes and carrots.',
    ingredients: [
      { name: 'Pork', quantity: 0.5, unit: 'kg', price: 175, priority: 'high' },
      { name: 'Pork Liver', quantity: 0.25, unit: 'kg', price: 60, priority: 'medium' },
      { name: 'Potato', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 2, unit: 'pcs', price: 20, priority: 'medium' },
      { name: 'Tomato Sauce', quantity: 1, unit: 'can', price: 35, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Bell Pepper', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
    ],
  },
  {
    name: 'Beef Kare-Kare', category: 'Beef', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 120, servings: 6, tags: 'Traditional Filipino,Family Favorite',
    description: 'Oxtail in thick peanut sauce with vegetables and bagoong on the side.',
    ingredients: [
      { name: 'Oxtail', quantity: 1, unit: 'kg', price: 380, priority: 'high' },
      { name: 'Peanut Butter', quantity: 0.5, unit: 'cup', price: 35, priority: 'high' },
      { name: 'Talong', quantity: 2, unit: 'pcs', price: 30, priority: 'medium' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'medium' },
      { name: 'Banana Heart', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
      { name: 'Bagoong', quantity: 3, unit: 'tbsp', price: 20, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Chopsuey', category: 'Vegetables', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 25, servings: 4, tags: 'Healthy,Quick Meals',
    description: 'Colorful stir-fried mixed vegetables with a light savory sauce.',
    ingredients: [
      { name: 'Chicken', quantity: 0.3, unit: 'kg', price: 66, priority: 'medium' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'high' },
      { name: 'Cabbage', quantity: 0.5, unit: 'pc', price: 20, priority: 'high' },
      { name: 'Cauliflower', quantity: 1, unit: 'pc', price: 40, priority: 'medium' },
      { name: 'Snow Peas', quantity: 1, unit: 'pack', price: 35, priority: 'low' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Bulalo', category: 'Beef', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 150, servings: 6, tags: 'Traditional Filipino,Family Favorite',
    description: 'Slow-simmered beef shank and bone marrow soup with corn and pechay.',
    ingredients: [
      { name: 'Beef Shank', quantity: 1, unit: 'kg', price: 400, priority: 'high' },
      { name: 'Corn', quantity: 2, unit: 'pcs', price: 30, priority: 'high' },
      { name: 'Cabbage', quantity: 0.5, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Pechay', quantity: 1, unit: 'bundle', price: 25, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Patis', quantity: 2, unit: 'tbsp', price: 10, priority: 'low' },
    ],
  },
  // ── New dishes for a fuller weekly rotation ──────────────
  {
    name: 'Ginisang Monggo', category: 'Vegetables', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 45, servings: 5, tags: 'Budget Friendly,Healthy,Traditional Filipino',
    description: 'Hearty mung bean stew with malunggay — one of the cheapest, healthiest ulam.',
    ingredients: [
      { name: 'Monggo Beans', quantity: 0.25, unit: 'kg', price: 35, priority: 'high' },
      { name: 'Pork', quantity: 0.2, unit: 'kg', price: 70, priority: 'medium' },
      { name: 'Malunggay Leaves', quantity: 1, unit: 'bundle', price: 15, priority: 'medium' },
      { name: 'Kamatis', quantity: 2, unit: 'pcs', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Fish Sauce', quantity: 2, unit: 'tbsp', price: 10, priority: 'low' },
    ],
  },
  {
    name: 'Tortang Talong', category: 'Vegetables', mealTypes: 'breakfast,lunch,dinner',
    prepTimeMinutes: 20, servings: 2, tags: 'Budget Friendly,Quick Meals',
    description: 'Grilled eggplant omelette — a 20-minute budget saver.',
    ingredients: [
      { name: 'Talong', quantity: 2, unit: 'pcs', price: 30, priority: 'high' },
      { name: 'Eggs', quantity: 3, unit: 'pcs', price: 30, priority: 'high' },
      { name: 'Garlic', quantity: 0.5, unit: 'head', price: 8, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 3, unit: 'tbsp', price: 12, priority: 'medium' },
    ],
  },
  {
    name: 'Arroz Caldo', category: 'Breakfast', mealTypes: 'breakfast,snack',
    prepTimeMinutes: 40, servings: 4, tags: 'Budget Friendly,Traditional Filipino,Family Favorite',
    description: 'Warm ginger rice porridge with chicken, garlic bits, and calamansi.',
    ingredients: [
      { name: 'Rice', quantity: 1.5, unit: 'cups', price: 20, priority: 'high' },
      { name: 'Chicken', quantity: 0.5, unit: 'kg', price: 110, priority: 'high' },
      { name: 'Ginger', quantity: 1, unit: 'pc', price: 15, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Green Onion', quantity: 1, unit: 'bundle', price: 15, priority: 'low' },
      { name: 'Calamansi', quantity: 6, unit: 'pcs', price: 10, priority: 'low' },
      { name: 'Fish Sauce', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Champorado', category: 'Breakfast', mealTypes: 'breakfast,snack',
    prepTimeMinutes: 25, servings: 4, tags: 'Budget Friendly,Quick Meals,Family Favorite',
    description: 'Chocolate rice porridge kids love — pairs with a splash of milk.',
    ingredients: [
      { name: 'Sticky Rice', quantity: 1, unit: 'cup', price: 25, priority: 'high' },
      { name: 'Tablea Chocolate', quantity: 4, unit: 'pcs', price: 40, priority: 'high' },
      { name: 'Sugar', quantity: 0.5, unit: 'cup', price: 15, priority: 'medium' },
      { name: 'Milk', quantity: 1, unit: 'small can', price: 35, priority: 'low' },
    ],
  },
  {
    name: 'Longsilog', category: 'Breakfast', mealTypes: 'breakfast',
    prepTimeMinutes: 20, servings: 2, tags: 'Budget Friendly,Quick Meals',
    description: 'Sweet longganisa sausages with garlic rice and fried egg.',
    ingredients: [
      { name: 'Longganisa', quantity: 6, unit: 'pcs', price: 90, priority: 'high' },
      { name: 'Rice', quantity: 2, unit: 'cups', price: 25, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pcs', price: 20, priority: 'high' },
      { name: 'Garlic', quantity: 0.5, unit: 'head', price: 8, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 3, unit: 'tbsp', price: 12, priority: 'medium' },
    ],
  },
  {
    name: 'Corned Beef Guisado', category: 'Breakfast', mealTypes: 'breakfast,lunch',
    prepTimeMinutes: 15, servings: 3, tags: 'Budget Friendly,Quick Meals',
    description: 'Pantry-staple corned beef sautéed with potatoes, garlic, and onion.',
    ingredients: [
      { name: 'Corned Beef', quantity: 1, unit: 'can', price: 45, priority: 'high' },
      { name: 'Potato', quantity: 1, unit: 'pc', price: 12, priority: 'medium' },
      { name: 'Garlic', quantity: 0.5, unit: 'head', price: 8, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Ginisang Sardinas', category: 'Fish & Seafood', mealTypes: 'breakfast,lunch,dinner',
    prepTimeMinutes: 15, servings: 3, tags: 'Budget Friendly,Quick Meals',
    description: 'Canned sardines lifted with garlic, onion, tomato, and a beaten egg.',
    ingredients: [
      { name: 'Canned Sardines', quantity: 1, unit: 'can', price: 30, priority: 'high' },
      { name: 'Eggs', quantity: 2, unit: 'pcs', price: 20, priority: 'medium' },
      { name: 'Kamatis', quantity: 2, unit: 'pcs', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 0.5, unit: 'head', price: 8, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
  {
    name: 'Fried Bangus', category: 'Fish & Seafood', mealTypes: 'breakfast,lunch,dinner',
    prepTimeMinutes: 25, servings: 3, tags: 'Healthy,Traditional Filipino',
    description: 'Crispy fried marinated milkfish with vinegar dip.',
    ingredients: [
      { name: 'Bangus', quantity: 1, unit: 'pc', price: 180, priority: 'high' },
      { name: 'Vinegar', quantity: 0.25, unit: 'cup', price: 10, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'medium' },
      { name: 'Black Pepper', quantity: 1, unit: 'tsp', price: 5, priority: 'low' },
      { name: 'Cooking Oil', quantity: 0.5, unit: 'cup', price: 30, priority: 'high' },
    ],
  },
  {
    name: 'Bicol Express', category: 'Pork', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 45, servings: 4, tags: 'Traditional Filipino',
    description: 'Creamy, spicy pork in coconut milk with chilies and shrimp paste.',
    ingredients: [
      { name: 'Pork', quantity: 0.5, unit: 'kg', price: 175, priority: 'high' },
      { name: 'Coconut Milk', quantity: 2, unit: 'cups', price: 50, priority: 'high' },
      { name: 'Siling Haba', quantity: 6, unit: 'pcs', price: 20, priority: 'high' },
      { name: 'Bagoong', quantity: 2, unit: 'tbsp', price: 15, priority: 'medium' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Ginger', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Pork Giniling', category: 'Pork', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 30, servings: 4, tags: 'Budget Friendly,Quick Meals,Family Favorite',
    description: 'Ground pork sautéed with potatoes, carrots, and tomato sauce — stretches far on a budget.',
    ingredients: [
      { name: 'Ground Pork', quantity: 0.5, unit: 'kg', price: 160, priority: 'high' },
      { name: 'Potato', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Tomato Sauce', quantity: 1, unit: 'can', price: 35, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Green Peas', quantity: 1, unit: 'small can', price: 25, priority: 'low' },
    ],
  },
  {
    name: 'Chicken Curry', category: 'Chicken', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 45, servings: 4, tags: 'Family Favorite',
    description: 'Filipino-style chicken curry in coconut milk with potatoes and bell pepper.',
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'kg', price: 220, priority: 'high' },
      { name: 'Coconut Milk', quantity: 2, unit: 'cups', price: 50, priority: 'high' },
      { name: 'Curry Powder', quantity: 2, unit: 'tbsp', price: 20, priority: 'high' },
      { name: 'Potato', quantity: 2, unit: 'pcs', price: 25, priority: 'medium' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Bell Pepper', quantity: 1, unit: 'pc', price: 25, priority: 'low' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Ginataang Gulay', category: 'Vegetables', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 30, servings: 4, tags: 'Healthy,Budget Friendly,Traditional Filipino',
    description: 'Squash and string beans simmered in coconut milk.',
    ingredients: [
      { name: 'Squash', quantity: 0.5, unit: 'pc', price: 25, priority: 'high' },
      { name: 'Sitaw', quantity: 1, unit: 'bundle', price: 40, priority: 'high' },
      { name: 'Coconut Milk', quantity: 2, unit: 'cups', price: 50, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'medium' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Bagoong', quantity: 2, unit: 'tbsp', price: 15, priority: 'medium' },
    ],
  },
  {
    name: 'Turon', category: 'Snack', mealTypes: 'snack',
    prepTimeMinutes: 20, servings: 4, tags: 'Budget Friendly,Quick Meals,Family Favorite',
    description: 'Caramelized banana rolls in crispy lumpia wrapper — the classic merienda.',
    ingredients: [
      { name: 'Saba Banana', quantity: 6, unit: 'pcs', price: 30, priority: 'high' },
      { name: 'Lumpia Wrapper', quantity: 1, unit: 'pack', price: 25, priority: 'high' },
      { name: 'Brown Sugar', quantity: 0.5, unit: 'cup', price: 20, priority: 'high' },
      { name: 'Cooking Oil', quantity: 0.5, unit: 'cup', price: 30, priority: 'medium' },
    ],
  },
  {
    name: 'Banana Cue', category: 'Snack', mealTypes: 'snack',
    prepTimeMinutes: 15, servings: 4, tags: 'Budget Friendly,Quick Meals',
    description: 'Deep-fried saba bananas coated in caramelized brown sugar on skewers.',
    ingredients: [
      { name: 'Saba Banana', quantity: 8, unit: 'pcs', price: 40, priority: 'high' },
      { name: 'Brown Sugar', quantity: 0.75, unit: 'cup', price: 25, priority: 'high' },
      { name: 'Cooking Oil', quantity: 0.5, unit: 'cup', price: 30, priority: 'medium' },
    ],
  },
  {
    name: 'Lumpiang Gulay', category: 'Snack', mealTypes: 'snack,lunch',
    prepTimeMinutes: 30, servings: 5, tags: 'Budget Friendly,Healthy',
    description: 'Crunchy vegetable spring rolls with vinegar-garlic dip.',
    ingredients: [
      { name: 'Lumpia Wrapper', quantity: 1, unit: 'pack', price: 25, priority: 'high' },
      { name: 'Togue', quantity: 0.25, unit: 'kg', price: 20, priority: 'high' },
      { name: 'Carrots', quantity: 1, unit: 'pc', price: 20, priority: 'medium' },
      { name: 'Cabbage', quantity: 0.25, unit: 'pc', price: 10, priority: 'medium' },
      { name: 'Garlic', quantity: 0.5, unit: 'head', price: 8, priority: 'medium' },
      { name: 'Cooking Oil', quantity: 0.5, unit: 'cup', price: 30, priority: 'medium' },
    ],
  },
  {
    name: 'Dinuguan', category: 'Pork', mealTypes: 'lunch,dinner',
    prepTimeMinutes: 50, servings: 4, tags: 'Traditional Filipino,Family Favorite',
    description: 'Savory pork blood stew simmered in vinegar, garlic, and chili peppers.',
    ingredients: [
      { name: 'Pork', quantity: 0.5, unit: 'kg', price: 175, priority: 'high' },
      { name: 'Pork Blood', quantity: 1, unit: 'cup', price: 35, priority: 'high' },
      { name: 'Vinegar', quantity: 0.5, unit: 'cup', price: 15, priority: 'high' },
      { name: 'Garlic', quantity: 1, unit: 'head', price: 15, priority: 'high' },
      { name: 'Onion', quantity: 1, unit: 'pc', price: 15, priority: 'medium' },
      { name: 'Siling Haba', quantity: 3, unit: 'pcs', price: 15, priority: 'low' },
      { name: 'Bay Leaves', quantity: 2, unit: 'pcs', price: 10, priority: 'low' },
      { name: 'Black Pepper', quantity: 1, unit: 'tsp', price: 5, priority: 'low' },
      { name: 'Cooking Oil', quantity: 2, unit: 'tbsp', price: 10, priority: 'medium' },
    ],
  },
];

export function dishCost(dish: SeedDish): number {
  return dish.ingredients.reduce((sum, i) => sum + i.price, 0);
}

/**
 * Idempotent seeding:
 * - New dishes are inserted with full metadata + ingredients.
 * - Existing dishes (matched by name) get their metadata refreshed so old
 *   installs pick up descriptions/tags/meal types added in later versions.
 */
export function seedDishes() {
  if (Platform.OS === 'web') return;

  for (const dish of SEED_DISHES) {
    const existing = db!.getFirstSync<{ id: number }>(
      `SELECT id FROM dishes WHERE name = ?;`,
      [dish.name]
    );

    if (existing) {
      db!.runSync(
        `UPDATE dishes
           SET category = ?, estimatedCost = ?, prepTimeMinutes = ?,
               description = ?, servings = ?, tags = ?, mealTypes = ?
         WHERE id = ? AND (isCustom IS NULL OR isCustom = 0);`,
        [
          dish.category,
          dishCost(dish),
          dish.prepTimeMinutes,
          dish.description,
          dish.servings,
          dish.tags,
          dish.mealTypes,
          existing.id,
        ]
      );
      continue;
    }

    const result = db!.runSync(
      `INSERT INTO dishes (name, category, estimatedCost, prepTimeMinutes, description, servings, tags, mealTypes, isCustom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        dish.name,
        dish.category,
        dishCost(dish),
        dish.prepTimeMinutes,
        dish.description,
        dish.servings,
        dish.tags,
        dish.mealTypes,
      ]
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
