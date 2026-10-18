import { Platform } from 'react-native';
import { db } from './db';
import { getAllDishes, type Dish } from './dishRepository';
import { getWeekStart } from '../../shared/utils/week';

// Re-exported so older imports keep working.
export { getAllDishes, type Dish };

export interface MealPlanEntry {
  id: number;
  userId: number;
  dishId: number;
  dayOfWeek: string;
  mealType: string;
  weekStartDate?: string;
  dishName?: string;
  estimatedCost?: number;
  servings?: number;
}

const mockEntries: MealPlanEntry[] = [];
let mockNextId = 1;

async function webDishInfo(
  dishId: number
): Promise<{ name?: string; cost?: number; servings?: number }> {
  const dishes = await getAllDishes();
  const dish = dishes.find((d) => d.id === dishId);
  return { name: dish?.name, cost: dish?.estimatedCost, servings: dish?.servings };
}

export async function addMealPlanEntry(
  userId: number,
  dishId: number,
  dayOfWeek: string,
  mealType: string,
  weekStartDate: string = getWeekStart()
): Promise<void> {
  const createdAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    const info = await webDishInfo(dishId);
    const idx = mockEntries.findIndex(
      (e) => e.userId === userId && e.dayOfWeek === dayOfWeek && e.mealType === mealType
    );
    if (idx !== -1) mockEntries.splice(idx, 1);
    mockEntries.push({
      id: mockNextId++,
      userId,
      dishId,
      dayOfWeek,
      mealType,
      weekStartDate,
      dishName: info.name,
      estimatedCost: info.cost,
      servings: info.servings,
    });
    return;
  }
  db!.runSync(
    `DELETE FROM meal_plan_entries WHERE userId = ? AND dayOfWeek = ? AND mealType = ?;`,
    [userId, dayOfWeek, mealType]
  );
  db!.runSync(
    `INSERT INTO meal_plan_entries (userId, dishId, dayOfWeek, mealType, createdAt, weekStartDate)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [userId, dishId, dayOfWeek, mealType, createdAt, weekStartDate]
  );
}

export async function getMealPlanForUser(userId: number): Promise<MealPlanEntry[]> {
  if (Platform.OS === 'web') return mockEntries.filter((e) => e.userId === userId);
  return db!.getAllSync<MealPlanEntry>(
    `SELECT mpe.*, d.name as dishName, d.estimatedCost, d.servings
     FROM meal_plan_entries mpe
     JOIN dishes d ON mpe.dishId = d.id
     WHERE mpe.userId = ?;`,
    [userId]
  );
}

export async function getPlanWeekStart(userId: number): Promise<string | null> {
  if (Platform.OS === 'web') {
    const entry = mockEntries.find((e) => e.userId === userId && e.weekStartDate);
    return entry?.weekStartDate ?? null;
  }
  const row = db!.getFirstSync<{ weekStartDate: string }>(
    `SELECT weekStartDate FROM meal_plan_entries WHERE userId = ? AND weekStartDate IS NOT NULL LIMIT 1;`,
    [userId]
  );
  return row?.weekStartDate ?? null;
}

export async function removeMealPlanEntry(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockEntries.findIndex((e) => e.id === id);
    if (idx !== -1) mockEntries.splice(idx, 1);
    return;
  }
  db!.runSync(`DELETE FROM meal_plan_entries WHERE id = ?;`, [id]);
}

/** Drops every plan slot that pointed at a deleted dish. */
export async function removeMealPlanEntriesByDishId(dishId: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockEntries.length - 1; i >= 0; i--) {
      if (mockEntries[i].dishId === dishId) mockEntries.splice(i, 1);
    }
    return;
  }
  db!.runSync(`DELETE FROM meal_plan_entries WHERE dishId = ?;`, [dishId]);
}

export async function clearMealPlanForUser(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockEntries.length - 1; i >= 0; i--) {
      if (mockEntries[i].userId === userId) mockEntries.splice(i, 1);
    }
    return;
  }
  db!.runSync(`DELETE FROM meal_plan_entries WHERE userId = ?;`, [userId]);
}

/** Clears only the active week's meals, preserving archived weeks. */
export async function clearMealPlanForWeek(
  userId: number,
  weekStartDate: string = getWeekStart()
): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockEntries.length - 1; i >= 0; i--) {
      if (mockEntries[i].userId === userId && mockEntries[i].weekStartDate === weekStartDate) {
        mockEntries.splice(i, 1);
      }
    }
    return;
  }
  db!.runSync(
    `DELETE FROM meal_plan_entries WHERE userId = ? AND weekStartDate = ?;`,
    [userId, weekStartDate]
  );
}

/** Replaces the user's entire weekly plan in one go (used by the auto-generator). */
export async function replaceMealPlanForUser(
  userId: number,
  entries: Array<{ dishId: number; dayOfWeek: string; mealType: string }>,
  weekStartDate: string = getWeekStart()
): Promise<void> {
  if (Platform.OS === 'web') {
    const kept = mockEntries.filter((e) => e.userId !== userId);
    mockEntries.length = 0;
    mockEntries.push(...kept);
    for (const entry of entries) {
      const info = await webDishInfo(entry.dishId);
      mockEntries.push({
        id: mockNextId++,
        userId,
        ...entry,
        weekStartDate,
        dishName: info.name,
        estimatedCost: info.cost,
        servings: info.servings,
      });
    }
    return;
  }
  const createdAt = new Date().toISOString();
  db!.runSync(`DELETE FROM meal_plan_entries WHERE userId = ?;`, [userId]);
  for (const entry of entries) {
    db!.runSync(
      `INSERT INTO meal_plan_entries (userId, dishId, dayOfWeek, mealType, createdAt, weekStartDate)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [userId, entry.dishId, entry.dayOfWeek, entry.mealType, createdAt, weekStartDate]
    );
  }
}

/** Replaces only selected days, preserving the rest of the current week. */
export async function replaceMealPlanDaysForUser(
  userId: number,
  days: string[],
  entries: Array<{ dishId: number; dayOfWeek: string; mealType: string }>,
  weekStartDate: string = getWeekStart()
): Promise<void> {
  const selectedDays = new Set(days);
  if (Platform.OS === 'web') {
    for (let i = mockEntries.length - 1; i >= 0; i--) {
      if (mockEntries[i].userId === userId && selectedDays.has(mockEntries[i].dayOfWeek)) {
        mockEntries.splice(i, 1);
      }
    }
    for (const entry of entries) {
      const info = await webDishInfo(entry.dishId);
      mockEntries.push({
        id: mockNextId++,
        userId,
        ...entry,
        weekStartDate,
        dishName: info.name,
        estimatedCost: info.cost,
        servings: info.servings,
      });
    }
    return;
  }
  const placeholders = days.map(() => '?').join(',');
  if (days.length > 0) {
    db!.runSync(
      `DELETE FROM meal_plan_entries WHERE userId = ? AND dayOfWeek IN (${placeholders});`,
      [userId, ...days]
    );
  }
  const createdAt = new Date().toISOString();
  for (const entry of entries) {
    db!.runSync(
      `INSERT INTO meal_plan_entries (userId, dishId, dayOfWeek, mealType, createdAt, weekStartDate)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [userId, entry.dishId, entry.dayOfWeek, entry.mealType, createdAt, weekStartDate]
    );
  }
}
