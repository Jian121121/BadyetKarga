import { Platform } from 'react-native';
import { db } from './db';

export interface PantryItem {
  id: number;
  userId: number;
  ingredientName: string;
  quantity: string;
  createdAt: string;
}

const WEB_PANTRY_KEY = 'badyetkarga_web_pantry';

function loadWebPantry(): PantryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_PANTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PantryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebPantry(items: PantryItem[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_PANTRY_KEY, JSON.stringify(items));
}

const mockPantry: PantryItem[] = Platform.OS === 'web' ? loadWebPantry() : [];
let mockNextId = mockPantry.reduce((max, p) => Math.max(max, p.id), 0) + 1;

export async function addPantryItem(userId: number, ingredientName: string, quantity: string): Promise<void> {
  const createdAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    mockPantry.push({ id: mockNextId++, userId, ingredientName, quantity, createdAt });
    saveWebPantry(mockPantry);
    return;
  }
  db!.runSync(
    `INSERT INTO pantry_items (userId, ingredientName, quantity, createdAt) VALUES (?, ?, ?, ?);`,
    [userId, ingredientName, quantity, createdAt]
  );
}

/** Upsert by case-insensitive name so shopping completion does not duplicate pantry rows. */
export async function upsertPantryItem(
  userId: number,
  ingredientName: string,
  quantity: string
): Promise<void> {
  const key = ingredientName.trim().toLowerCase();
  if (Platform.OS === 'web') {
    const existing = mockPantry.find(
      (p) => p.userId === userId && p.ingredientName.toLowerCase() === key
    );
    if (existing) {
      existing.quantity = quantity || existing.quantity;
      saveWebPantry(mockPantry);
      return;
    }
    await addPantryItem(userId, ingredientName, quantity);
    return;
  }
  const row = db!.getFirstSync<{ id: number; quantity: string }>(
    `SELECT id, quantity FROM pantry_items WHERE userId = ? AND LOWER(ingredientName) = ?;`,
    [userId, key]
  );
  if (row) {
    db!.runSync(`UPDATE pantry_items SET quantity = ? WHERE id = ?;`, [
      quantity || row.quantity,
      row.id,
    ]);
    return;
  }
  await addPantryItem(userId, ingredientName, quantity);
}

export async function getPantryItems(userId: number): Promise<PantryItem[]> {
  if (Platform.OS === 'web') return mockPantry.filter((p) => p.userId === userId);
  return db!.getAllSync<PantryItem>(`SELECT * FROM pantry_items WHERE userId = ?;`, [userId]);
}

export async function deletePantryItem(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockPantry.findIndex((p) => p.id === id);
    if (idx !== -1) mockPantry.splice(idx, 1);
    saveWebPantry(mockPantry);
    return;
  }
  db!.runSync(`DELETE FROM pantry_items WHERE id = ?;`, [id]);
}

export async function clearPantryItems(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (let i = mockPantry.length - 1; i >= 0; i--) {
      if (mockPantry[i].userId === userId) mockPantry.splice(i, 1);
    }
    saveWebPantry(mockPantry);
    return;
  }
  db!.runSync(`DELETE FROM pantry_items WHERE userId = ?;`, [userId]);
}
