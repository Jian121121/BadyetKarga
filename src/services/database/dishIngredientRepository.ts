import { Platform } from 'react-native';
import { db } from './db';
import { getWebIngredients } from './dishRepository';

export interface DishIngredient {
  id: number;
  dishId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  priority: 'high' | 'medium' | 'low';
}

export async function getIngredientsForDish(dishId: number): Promise<DishIngredient[]> {
  if (Platform.OS === 'web') return getWebIngredients([dishId]);
  return db!.getAllSync<DishIngredient>(
    `SELECT * FROM dish_ingredients WHERE dishId = ?;`,
    [dishId]
  );
}

export async function getIngredientsForDishes(dishIds: number[]): Promise<DishIngredient[]> {
  if (dishIds.length === 0) return [];
  if (Platform.OS === 'web') return getWebIngredients(dishIds);
  const placeholders = dishIds.map(() => '?').join(',');
  return db!.getAllSync<DishIngredient>(
    `SELECT * FROM dish_ingredients WHERE dishId IN (${placeholders});`,
    dishIds
  );
}
