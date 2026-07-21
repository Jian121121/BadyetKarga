import { Platform } from 'react-native';
import { db } from './db';

export interface PantryItem {
  id: number;
  userId: number;
  ingredientName: string;
  quantity: string;
  createdAt: string;
}

const mockPantry: PantryItem[] = [];
let mockNextId = 1;

export async function addPantryItem(userId: number, ingredientName: string, quantity: string): Promise<void> {
  const createdAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    mockPantry.push({ id: mockNextId++, userId, ingredientName, quantity, createdAt });
    return;
  }
  db!.runSync(
    `INSERT INTO pantry_items (userId, ingredientName, quantity, createdAt) VALUES (?, ?, ?, ?);`,
    [userId, ingredientName, quantity, createdAt]
  );
}

export async function getPantryItems(userId: number): Promise<PantryItem[]> {
  if (Platform.OS === 'web') return mockPantry.filter((p) => p.userId === userId);
  return db!.getAllSync<PantryItem>(`SELECT * FROM pantry_items WHERE userId = ?;`, [userId]);
}

export async function deletePantryItem(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockPantry.findIndex((p) => p.id === id);
    if (idx !== -1) mockPantry.splice(idx, 1);
    return;
  }
  db!.runSync(`DELETE FROM pantry_items WHERE id = ?;`, [id]);
}