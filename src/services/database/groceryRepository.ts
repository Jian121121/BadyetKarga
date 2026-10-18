import { Platform } from 'react-native';
import { db } from './db';
import { getWeekStart } from '../../shared/utils/week';

export interface GroceryItem {
  id: number;
  userId: number;
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  usedInDishes: string;
  isChecked: boolean;
  weekStartDate?: string;
}

const WEB_GROCERY_KEY = 'badyetkarga_web_grocery';

function loadWebGrocery(): GroceryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_GROCERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GroceryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebGrocery(items: GroceryItem[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(WEB_GROCERY_KEY, JSON.stringify(items));
  }
}

const mockGrocery: GroceryItem[] = Platform.OS === 'web' ? loadWebGrocery() : [];
let mockNextId = 1;
mockNextId = mockGrocery.reduce((max, item) => Math.max(max, item.id), 0) + 1;

export async function replaceGroceryList(
  userId: number,
  items: {
    ingredientName: string;
    category: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    priority: string;
    usedInDishes: string;
    isChecked?: boolean;
  }[],
  weekStartDate: string = getWeekStart()
) {
  if (Platform.OS === 'web') {
    const manualItems = mockGrocery.filter(
      (g) => g.userId === userId && g.usedInDishes === 'Added manually'
    );
    const filtered = mockGrocery.filter((g) => g.userId !== userId);
    mockGrocery.length = 0;
    mockGrocery.push(
      ...filtered,
      ...manualItems,
      ...items.map(
        (i) =>
          ({
            id: mockNextId++,
            userId,
            weekStartDate,
            ...i,
            isChecked: !!i.isChecked,
          }) as GroceryItem
      )
    );
    saveWebGrocery(mockGrocery);
    return;
  }
  const manualItems = db!.getAllSync<GroceryItem>(
    `SELECT * FROM grocery_items WHERE userId = ? AND usedInDishes = 'Added manually';`,
    [userId]
  );
  db!.runSync(`DELETE FROM grocery_items WHERE userId = ?;`, [userId]);
  for (const item of manualItems) {
    db!.runSync(
      `INSERT INTO grocery_items (userId, ingredientName, category, quantity, unit, estimatedCost, priority, usedInDishes, isChecked, weekStartDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.userId,
        item.ingredientName,
        item.category,
        item.quantity,
        item.unit,
        item.estimatedCost,
        item.priority,
        item.usedInDishes,
        item.isChecked ? 1 : 0,
        weekStartDate,
      ]
    );
  }
  for (const item of items) {
    db!.runSync(
      `INSERT INTO grocery_items (userId, ingredientName, category, quantity, unit, estimatedCost, priority, usedInDishes, isChecked, weekStartDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        userId,
        item.ingredientName,
        item.category,
        item.quantity,
        item.unit,
        item.estimatedCost,
        item.priority,
        item.usedInDishes,
        item.isChecked ? 1 : 0,
        weekStartDate,
      ]
    );
  }
}

export async function clearGroceryListForUser(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockGrocery.length - 1; i >= 0; i--) {
      if (mockGrocery[i].userId === userId) mockGrocery.splice(i, 1);
    }
    return;
  }
  db!.runSync(`DELETE FROM grocery_items WHERE userId = ?;`, [userId]);
}

export async function getGroceryItems(userId: number): Promise<GroceryItem[]> {
  if (Platform.OS === 'web') return mockGrocery.filter((g) => g.userId === userId);
  const rows = db!.getAllSync<any>(`SELECT * FROM grocery_items WHERE userId = ?;`, [userId]);
  return rows.map((r) => ({ ...r, isChecked: !!r.isChecked }));
}

export async function toggleGroceryItem(id: number, isChecked: boolean) {
  if (Platform.OS === 'web') {
    const item = mockGrocery.find((g) => g.id === id);
    if (item) item.isChecked = isChecked;
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(`UPDATE grocery_items SET isChecked = ? WHERE id = ?;`, [isChecked ? 1 : 0, id]);
}

export async function updateGroceryItemPrice(id: number, newPrice: number) {
  if (Platform.OS === 'web') {
    const item = mockGrocery.find((g) => g.id === id);
    if (item) item.estimatedCost = newPrice;
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(`UPDATE grocery_items SET estimatedCost = ? WHERE id = ?;`, [newPrice, id]);
}

export async function updateGroceryItem(
  userId: number,
  id: number,
  patch: { ingredientName?: string; quantity?: number; estimatedCost?: number }
) {
  if (Platform.OS === 'web') {
    const item = mockGrocery.find((g) => g.userId === userId && g.id === id);
    if (item) Object.assign(item, patch);
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(
    `UPDATE grocery_items
     SET ingredientName = COALESCE(?, ingredientName),
         quantity = COALESCE(?, quantity),
         estimatedCost = COALESCE(?, estimatedCost)
     WHERE userId = ? AND id = ?;`,
    [patch.ingredientName ?? null, patch.quantity ?? null, patch.estimatedCost ?? null, userId, id]
  );
}

/** Manually add a single item (user-added, not from a dish). */
export async function addGroceryItem(
  userId: number,
  ingredientName: string,
  estimatedCost: number,
  weekStartDate: string = getWeekStart(),
  category = 'Others'
) {
  if (Platform.OS === 'web') {
    mockGrocery.push({
      id: mockNextId++,
      userId,
      ingredientName,
      category,
      quantity: 1,
      unit: 'pc',
      estimatedCost,
      priority: 'medium',
      usedInDishes: 'Added manually',
      isChecked: false,
      weekStartDate,
    });
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(
    `INSERT INTO grocery_items (userId, ingredientName, category, quantity, unit, estimatedCost, priority, usedInDishes, isChecked, weekStartDate)
     VALUES (?, ?, ?, 1, 'pc', ?, 'medium', 'Added manually', 0, ?);`,
    [userId, ingredientName, category, estimatedCost, weekStartDate]
  );
}

export async function deleteGroceryItem(id: number) {
  if (Platform.OS === 'web') {
    const idx = mockGrocery.findIndex((g) => g.id === id);
    if (idx !== -1) mockGrocery.splice(idx, 1);
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(`DELETE FROM grocery_items WHERE id = ?;`, [id]);
}

/** Remove checked items after a completed shopping trip. */
export async function removeCheckedGroceryItems(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockGrocery.length - 1; i >= 0; i--) {
      if (mockGrocery[i].userId === userId && mockGrocery[i].isChecked) {
        mockGrocery.splice(i, 1);
      }
    }
    saveWebGrocery(mockGrocery);
    return;
  }
  db!.runSync(`DELETE FROM grocery_items WHERE userId = ? AND isChecked = 1;`, [userId]);
}
