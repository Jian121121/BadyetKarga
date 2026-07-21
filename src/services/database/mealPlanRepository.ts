import { Platform } from 'react-native';
import { db } from './db';

export interface Dish {
  id: number;
  name: string;
  category: string;
  estimatedCost: number;
  prepTimeMinutes: number;
}

export interface MealPlanEntry {
  id: number;
  userId: number;
  dishId: number;
  dayOfWeek: string;
  mealType: string;
  dishName?: string;
  estimatedCost?: number;
}

const mockDishes: Dish[] = [
  { id: 1, name: 'Chicken Adobo', category: 'Chicken', estimatedCost: 250, prepTimeMinutes: 45 },
  { id: 2, name: 'Sinigang na Hipon', category: 'Fish & Seafood', estimatedCost: 320, prepTimeMinutes: 40 },
];
const mockEntries: MealPlanEntry[] = [];
let mockNextId = 1;

export async function getAllDishes(): Promise<Dish[]> {
  if (Platform.OS === 'web') return mockDishes;
  return db!.getAllSync<Dish>(`SELECT * FROM dishes;`);
}

export async function addMealPlanEntry(
  userId: number,
  dishId: number,
  dayOfWeek: string,
  mealType: string
): Promise<void> {
  const createdAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    const dish = mockDishes.find((d) => d.id === dishId);
    mockEntries.push({ id: mockNextId++, userId, dishId, dayOfWeek, mealType, dishName: dish?.name, estimatedCost: dish?.estimatedCost });
    return;
  }
  db!.runSync(
    `INSERT INTO meal_plan_entries (userId, dishId, dayOfWeek, mealType, createdAt) VALUES (?, ?, ?, ?, ?);`,
    [userId, dishId, dayOfWeek, mealType, createdAt]
  );
}

export async function getMealPlanForUser(userId: number): Promise<MealPlanEntry[]> {
  if (Platform.OS === 'web') return mockEntries.filter((e) => e.userId === userId);
  return db!.getAllSync<MealPlanEntry>(
    `SELECT mpe.*, d.name as dishName, d.estimatedCost
     FROM meal_plan_entries mpe
     JOIN dishes d ON mpe.dishId = d.id
     WHERE mpe.userId = ?;`,
    [userId]
  );
}