import { Platform } from 'react-native';
import { db } from './db';

export function seedDishes() {
  if (Platform.OS === 'web') return;

  const count = db!.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM dishes;`);
  if (count && count.count > 0) return; // already seeded

  const dishes = [
    ['Chicken Adobo', 'Chicken', 250, 45],
    ['Sinigang na Hipon', 'Fish & Seafood', 320, 40],
    ['Ginisang Ampalaya', 'Vegetables', 120, 20],
    ['Beef Pares', 'Beef', 380, 60],
  ];

  for (const [name, category, cost, time] of dishes) {
    db!.runSync(
      `INSERT INTO dishes (name, category, estimatedCost, prepTimeMinutes) VALUES (?, ?, ?, ?);`,
      [name, category, cost, time]
    );
  }
}