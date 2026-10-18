import { Platform } from 'react-native';
import { db } from './db';
import { getWeekStart } from '../../shared/utils/week';

export interface ShoppingTrip {
  id: number;
  userId: number;
  completedAt: string;
  weekStart: string;
  budgetSnapshot: number;
  estimatedTotal: number;
  actualTotal: number;
}

export interface PurchaseItem {
  id: number;
  tripId: number;
  ingredientName: string;
  normalizedName: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  actualCost: number;
}

export interface CompleteTripInput {
  userId: number;
  budgetSnapshot: number;
  items: Array<{
    ingredientName: string;
    category: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    actualCost: number;
  }>;
  weekStart?: string;
}

const WEB_TRIPS_KEY = 'badyetkarga_web_shopping_trips';
const WEB_PURCHASES_KEY = 'badyetkarga_web_purchase_items';

function loadWeb<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWeb<T>(key: string, rows: T[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(rows));
}

const webTrips: ShoppingTrip[] = Platform.OS === 'web' ? loadWeb(WEB_TRIPS_KEY) : [];
const webPurchases: PurchaseItem[] = Platform.OS === 'web' ? loadWeb(WEB_PURCHASES_KEY) : [];
let webTripId = webTrips.reduce((m, t) => Math.max(m, t.id), 0) + 1;
let webPurchaseId = webPurchases.reduce((m, p) => Math.max(m, p.id), 0) + 1;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Archives a completed shopping trip (checked items only). */
export async function completeShoppingTrip(input: CompleteTripInput): Promise<ShoppingTrip> {
  const weekStart = input.weekStart ?? getWeekStart();
  const completedAt = new Date().toISOString();
  const estimatedTotal = input.items.reduce((s, i) => s + i.estimatedCost, 0);
  const actualTotal = input.items.reduce((s, i) => s + i.actualCost, 0);

  if (Platform.OS === 'web') {
    const trip: ShoppingTrip = {
      id: webTripId++,
      userId: input.userId,
      completedAt,
      weekStart,
      budgetSnapshot: input.budgetSnapshot,
      estimatedTotal,
      actualTotal,
    };
    webTrips.push(trip);
    for (const item of input.items) {
      webPurchases.push({
        id: webPurchaseId++,
        tripId: trip.id,
        ingredientName: item.ingredientName,
        normalizedName: normalizeName(item.ingredientName),
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimatedCost: item.estimatedCost,
        actualCost: item.actualCost,
      });
    }
    saveWeb(WEB_TRIPS_KEY, webTrips);
    saveWeb(WEB_PURCHASES_KEY, webPurchases);
    return trip;
  }

  const result = db!.runSync(
    `INSERT INTO shopping_trips (userId, completedAt, weekStart, budgetSnapshot, estimatedTotal, actualTotal)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [input.userId, completedAt, weekStart, input.budgetSnapshot, estimatedTotal, actualTotal]
  );
  const tripId = result.lastInsertRowId;
  for (const item of input.items) {
    db!.runSync(
      `INSERT INTO purchase_items (tripId, ingredientName, normalizedName, category, quantity, unit, estimatedCost, actualCost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        tripId,
        item.ingredientName,
        normalizeName(item.ingredientName),
        item.category,
        item.quantity,
        item.unit,
        item.estimatedCost,
        item.actualCost,
      ]
    );
  }
  return {
    id: tripId,
    userId: input.userId,
    completedAt,
    weekStart,
    budgetSnapshot: input.budgetSnapshot,
    estimatedTotal,
    actualTotal,
  };
}

export async function getTripsForUser(userId: number): Promise<ShoppingTrip[]> {
  if (Platform.OS === 'web') {
    return webTrips.filter((t) => t.userId === userId).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }
  return db!.getAllSync<ShoppingTrip>(
    `SELECT * FROM shopping_trips WHERE userId = ? ORDER BY completedAt DESC;`,
    [userId]
  );
}

export async function getPurchasesForTrip(tripId: number): Promise<PurchaseItem[]> {
  if (Platform.OS === 'web') return webPurchases.filter((p) => p.tripId === tripId);
  return db!.getAllSync<PurchaseItem>(`SELECT * FROM purchase_items WHERE tripId = ?;`, [tripId]);
}

export async function clearShoppingHistory(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    const tripIds = new Set(webTrips.filter((t) => t.userId === userId).map((t) => t.id));
    for (let i = webPurchases.length - 1; i >= 0; i--) {
      if (tripIds.has(webPurchases[i].tripId)) webPurchases.splice(i, 1);
    }
    for (let i = webTrips.length - 1; i >= 0; i--) {
      if (webTrips[i].userId === userId) webTrips.splice(i, 1);
    }
    saveWeb(WEB_TRIPS_KEY, webTrips);
    saveWeb(WEB_PURCHASES_KEY, webPurchases);
    return;
  }
  db!.runSync(
    `DELETE FROM purchase_items WHERE tripId IN (SELECT id FROM shopping_trips WHERE userId = ?);`,
    [userId]
  );
  db!.runSync(`DELETE FROM shopping_trips WHERE userId = ?;`, [userId]);
}

export async function getAllPurchasesForUser(userId: number): Promise<PurchaseItem[]> {
  if (Platform.OS === 'web') {
    const tripIds = new Set(webTrips.filter((t) => t.userId === userId).map((t) => t.id));
    return webPurchases.filter((p) => tripIds.has(p.tripId));
  }
  return db!.getAllSync<PurchaseItem>(
    `SELECT pi.* FROM purchase_items pi
     JOIN shopping_trips st ON st.id = pi.tripId
     WHERE st.userId = ?;`,
    [userId]
  );
}
