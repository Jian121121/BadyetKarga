import { Platform } from 'react-native';
import { db } from './db';

export interface MealException {
  id?: number;
  userId: number;
  dishId: number;
  dishName: string;
  allowedForPlan: boolean;
  reason?: string;
  createdAt?: string;
}

const WEB_EXCEPTIONS_KEY = 'badyetkarga_web_meal_exceptions';

function loadWebExceptions(): MealException[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_EXCEPTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MealException[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebExceptions(exceptions: MealException[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_EXCEPTIONS_KEY, JSON.stringify(exceptions));
}

const mockExceptions: MealException[] = Platform.OS === 'web' ? loadWebExceptions() : [];
let mockNextId = mockExceptions.reduce((max, e) => Math.max(max, e.id ?? 0), 0) + 1;

export async function getMealExceptions(userId: number): Promise<MealException[]> {
  if (Platform.OS === 'web') {
    return mockExceptions.filter((e) => e.userId === userId);
  }
  const rows = db!.getAllSync<any>(
    `SELECT * FROM meal_exceptions WHERE userId = ? ORDER BY id DESC;`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    dishId: r.dishId,
    dishName: r.dishName,
    allowedForPlan: !!r.allowedForPlan,
    reason: r.reason ?? '',
    createdAt: r.createdAt,
  }));
}

export async function addMealException(
  userId: number,
  dishId: number,
  dishName: string,
  allowedForPlan: boolean = true,
  reason: string = ''
): Promise<MealException> {
  const createdAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    const existingIndex = mockExceptions.findIndex(
      (e) => e.userId === userId && e.dishId === dishId
    );
    const item: MealException = {
      id: existingIndex >= 0 ? mockExceptions[existingIndex].id : mockNextId++,
      userId,
      dishId,
      dishName,
      allowedForPlan,
      reason,
      createdAt,
    };
    if (existingIndex >= 0) {
      mockExceptions[existingIndex] = item;
    } else {
      mockExceptions.push(item);
    }
    saveWebExceptions(mockExceptions);
    return item;
  }

  db!.runSync(`DELETE FROM meal_exceptions WHERE userId = ? AND dishId = ?;`, [userId, dishId]);

  const result = db!.runSync(
    `INSERT INTO meal_exceptions (userId, dishId, dishName, allowedForPlan, reason, createdAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [userId, dishId, dishName, allowedForPlan ? 1 : 0, reason, createdAt]
  );

  return {
    id: result.lastInsertRowId,
    userId,
    dishId,
    dishName,
    allowedForPlan,
    reason,
    createdAt,
  };
}

export async function removeMealException(userId: number, dishId: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockExceptions.findIndex((e) => e.userId === userId && e.dishId === dishId);
    if (idx >= 0) {
      mockExceptions.splice(idx, 1);
      saveWebExceptions(mockExceptions);
    }
    return;
  }
  db!.runSync(`DELETE FROM meal_exceptions WHERE userId = ? AND dishId = ?;`, [userId, dishId]);
}

export async function clearMealExceptions(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    const remaining = mockExceptions.filter((e) => e.userId !== userId);
    mockExceptions.length = 0;
    mockExceptions.push(...remaining);
    saveWebExceptions(mockExceptions);
    return;
  }
  db!.runSync(`DELETE FROM meal_exceptions WHERE userId = ?;`, [userId]);
}

