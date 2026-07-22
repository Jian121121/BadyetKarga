import { Platform } from 'react-native';
import { db } from './db';

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
}

const mockGrocery: GroceryItem[] = [];
let mockNextId = 1;

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
  }[]
) {
  if (Platform.OS === 'web') {
    const filtered = mockGrocery.filter((g) => g.userId !== userId);
    mockGrocery.length = 0;
    mockGrocery.push(
      ...filtered,
      ...items.map((i) => ({ id: mockNextId++, userId, isChecked: false, ...i } as GroceryItem))
    );
    return;
  }
  db!.runSync(`DELETE FROM grocery_items WHERE userId = ?;`, [userId]);
  for (const item of items) {
    db!.runSync(
      `INSERT INTO grocery_items (userId, ingredientName, category, quantity, unit, estimatedCost, priority, usedInDishes, isChecked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [userId, item.ingredientName, item.category, item.quantity, item.unit, item.estimatedCost, item.priority, item.usedInDishes]
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

export async function updateGroceryItemPrice(id: number, newPrice: number) {
  if (Platform.OS === 'web') {
    const item = mockGrocery.find((g) => g.id === id);
    if (item) item.estimatedCost = newPrice;
    return;
  }
  db!.runSync(`UPDATE grocery_items SET estimatedCost = ? WHERE id = ?;`, [newPrice, id]);
}