import { Platform } from 'react-native';
import { db } from './db';

export interface GroceryItem {
  id: number;
  userId: number;
  ingredientName: string;
  category: string;
  estimatedCost: number;
  isChecked: boolean;
}

const mockGrocery: GroceryItem[] = [];
let mockNextId = 1;

export async function replaceGroceryList(userId: number, items: { ingredientName: string; category: string; estimatedCost: number }[]) {
  if (Platform.OS === 'web') {
    const filtered = mockGrocery.filter((g) => g.userId !== userId);
    mockGrocery.length = 0;
    mockGrocery.push(...filtered, ...items.map((i) => ({ id: mockNextId++, userId, isChecked: false, ...i })));
    return;
  }
  db!.runSync(`DELETE FROM grocery_items WHERE userId = ?;`, [userId]);
  for (const item of items) {
    db!.runSync(
      `INSERT INTO grocery_items (userId, ingredientName, category, estimatedCost, isChecked) VALUES (?, ?, ?, ?, 0);`,
      [userId, item.ingredientName, item.category, item.estimatedCost]
    );
  }
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
    return;
  }
  db!.runSync(`UPDATE grocery_items SET isChecked = ? WHERE id = ?;`, [isChecked ? 1 : 0, id]);
}