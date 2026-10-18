import { Platform } from 'react-native';
import { db } from './db';
import { SEED_DISHES, dishCost } from './seedData';
import type { DishIngredient } from './dishIngredientRepository';

export interface Dish {
  id: number;
  name: string;
  category: string;
  estimatedCost: number;
  prepTimeMinutes: number;
  description: string;
  servings: number;
  /** Comma-joined style tags, e.g. "Budget Friendly,Quick Meals" */
  tags: string;
  /** Comma-joined meal types, e.g. "breakfast,lunch" */
  mealTypes: string;
  isCustom: boolean;
  createdBy: number | null;
  imageUri?: string | null;
}

export interface NewDishInput {
  name: string;
  category: string;
  mealTypes: string;
  prepTimeMinutes: number;
  servings: number;
  description: string;
  tags: string;
  imageUri?: string | null;
}

export interface NewIngredientInput {
  ingredientName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  priority: 'high' | 'medium' | 'low';
}

// ── Web mock (browser has no SQLite) ────────────────────────

const WEB_CUSTOM_DISHES_KEY = 'badyetkarga_web_custom_dishes';

interface WebDishBundle {
  dish: Dish;
  ingredients: DishIngredient[];
}

function buildSeedWebDishes(): WebDishBundle[] {
  let nextIngredientId = 1;
  return SEED_DISHES.map((seed, index) => {
    const dishId = index + 1;
    return {
      dish: {
        id: dishId,
        name: seed.name,
        category: seed.category,
        estimatedCost: dishCost(seed),
        prepTimeMinutes: seed.prepTimeMinutes,
        description: seed.description,
        servings: seed.servings,
        tags: seed.tags,
        mealTypes: seed.mealTypes,
        isCustom: false,
        createdBy: null,
        imageUri: null,
      },
      ingredients: seed.ingredients.map((ing) => ({
        id: nextIngredientId++,
        dishId,
        ingredientName: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        estimatedPrice: ing.price,
        priority: ing.priority,
      })),
    };
  });
}

function loadWebCustomDishes(): WebDishBundle[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_CUSTOM_DISHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WebDishBundle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebCustomDishes(bundles: WebDishBundle[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_CUSTOM_DISHES_KEY, JSON.stringify(bundles));
}

const webSeedDishes: WebDishBundle[] = Platform.OS === 'web' ? buildSeedWebDishes() : [];
const webCustomDishes: WebDishBundle[] = Platform.OS === 'web' ? loadWebCustomDishes() : [];

function allWebBundles(): WebDishBundle[] {
  return [...webSeedDishes, ...webCustomDishes];
}

/** Used by dishIngredientRepository's web path. */
export function getWebIngredients(dishIds?: number[]): DishIngredient[] {
  const wanted = dishIds ? new Set(dishIds) : null;
  return allWebBundles()
    .filter((b) => !wanted || wanted.has(b.dish.id))
    .flatMap((b) => b.ingredients);
}

// ── Public API ──────────────────────────────────────────────

function normalizeRow(row: any): Dish {
  return {
    ...row,
    description: row.description ?? '',
    servings: row.servings ?? 4,
    tags: row.tags ?? '',
    mealTypes: row.mealTypes ?? 'lunch,dinner',
    isCustom: !!row.isCustom,
    createdBy: row.createdBy ?? null,
    imageUri: row.imageUri ?? null,
  };
}

/**
 * All built-in dishes plus custom dishes. Pass `viewerId` to hide other accounts'
 * custom dishes (several accounts can share one device).
 */
export async function getAllDishes(viewerId?: number): Promise<Dish[]> {
  const dishes =
    Platform.OS === 'web'
      ? allWebBundles().map((b) => b.dish)
      : db!.getAllSync<any>(`SELECT * FROM dishes ORDER BY name;`).map(normalizeRow);
  if (viewerId === undefined) return dishes;
  return dishes.filter((d) => !d.isCustom || d.createdBy === viewerId);
}

/** Replaces a custom dish's details and ingredient list. Only the owner can edit. */
export async function updateCustomDish(
  userId: number,
  dishId: number,
  dish: NewDishInput,
  ingredients: NewIngredientInput[]
): Promise<boolean> {
  const estimatedCost = ingredients.reduce((sum, i) => sum + i.estimatedPrice, 0);

  if (Platform.OS === 'web') {
    const bundle = webCustomDishes.find(
      (b) => b.dish.id === dishId && b.dish.isCustom && b.dish.createdBy === userId
    );
    if (!bundle) return false;
    let nextIngId =
      allWebBundles().reduce((max, b) => Math.max(max, ...b.ingredients.map((i) => i.id), 0), 0) + 1;
    bundle.dish = { ...bundle.dish, ...dish, imageUri: dish.imageUri ?? null, estimatedCost };
    bundle.ingredients = ingredients.map((ing) => ({ id: nextIngId++, dishId, ...ing }));
    saveWebCustomDishes(webCustomDishes);
    return true;
  }

  const row = db!.getFirstSync<{ isCustom: number; createdBy: number | null }>(
    `SELECT isCustom, createdBy FROM dishes WHERE id = ?;`,
    [dishId]
  );
  if (!row || !row.isCustom || row.createdBy !== userId) return false;
  db!.runSync(
    `UPDATE dishes SET name = ?, category = ?, estimatedCost = ?, prepTimeMinutes = ?, description = ?, servings = ?, tags = ?, mealTypes = ?, imageUri = ?
     WHERE id = ?;`,
    [
      dish.name,
      dish.category,
      estimatedCost,
      dish.prepTimeMinutes,
      dish.description,
      dish.servings,
      dish.tags,
      dish.mealTypes,
      dish.imageUri ?? null,
      dishId,
    ]
  );
  db!.runSync(`DELETE FROM dish_ingredients WHERE dishId = ?;`, [dishId]);
  for (const ing of ingredients) {
    db!.runSync(
      `INSERT INTO dish_ingredients (dishId, ingredientName, quantity, unit, estimatedPrice, priority) VALUES (?, ?, ?, ?, ?, ?);`,
      [dishId, ing.ingredientName, ing.quantity, ing.unit, ing.estimatedPrice, ing.priority]
    );
  }
  return true;
}

/**
 * Adds a user-created dish plus its ingredient list.
 * Custom dishes join the same pool as seeded ones, so they appear in the
 * Dish Library AND get picked up by the weekly plan generator.
 */
export async function addCustomDish(
  userId: number,
  dish: NewDishInput,
  ingredients: NewIngredientInput[]
): Promise<Dish> {
  const estimatedCost = ingredients.reduce((sum, i) => sum + i.estimatedPrice, 0);

  if (Platform.OS === 'web') {
    const maxId = allWebBundles().reduce((max, b) => Math.max(max, b.dish.id), 0);
    const dishId = maxId + 1;
    let nextIngId =
      allWebBundles().reduce(
        (max, b) => Math.max(max, ...b.ingredients.map((i) => i.id), 0),
        0
      ) + 1;
    const bundle: WebDishBundle = {
      dish: {
        id: dishId,
        ...dish,
        imageUri: dish.imageUri ?? null,
        estimatedCost,
        isCustom: true,
        createdBy: userId,
      },
      ingredients: ingredients.map((ing) => ({ id: nextIngId++, dishId, ...ing })),
    };
    webCustomDishes.push(bundle);
    saveWebCustomDishes(webCustomDishes);
    return bundle.dish;
  }

  const result = db!.runSync(
    `INSERT INTO dishes (name, category, estimatedCost, prepTimeMinutes, description, servings, tags, mealTypes, isCustom, createdBy, imageUri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);`,
    [
      dish.name,
      dish.category,
      estimatedCost,
      dish.prepTimeMinutes,
      dish.description,
      dish.servings,
      dish.tags,
      dish.mealTypes,
      userId,
      dish.imageUri ?? null,
    ]
  );
  const dishId = result.lastInsertRowId;
  for (const ing of ingredients) {
    db!.runSync(
      `INSERT INTO dish_ingredients (dishId, ingredientName, quantity, unit, estimatedPrice, priority) VALUES (?, ?, ?, ?, ?, ?);`,
      [dishId, ing.ingredientName, ing.quantity, ing.unit, ing.estimatedPrice, ing.priority]
    );
  }

  return {
    id: dishId,
    ...dish,
    imageUri: dish.imageUri ?? null,
    estimatedCost,
    isCustom: true,
    createdBy: userId,
  };
}

/**
 * Deletes a personal (custom) dish owned by the user, plus its ingredients
 * and any meal-plan slots that referenced it.
 */
export async function deleteCustomDish(userId: number, dishId: number): Promise<boolean> {
  const { removeMealPlanEntriesByDishId } = await import('./mealPlanRepository');

  if (Platform.OS === 'web') {
    const idx = webCustomDishes.findIndex(
      (b) => b.dish.id === dishId && b.dish.isCustom && b.dish.createdBy === userId
    );
    if (idx === -1) return false;
    webCustomDishes.splice(idx, 1);
    saveWebCustomDishes(webCustomDishes);
    await removeMealPlanEntriesByDishId(dishId);
    return true;
  }

  const row = db!.getFirstSync<{ id: number; isCustom: number; createdBy: number | null }>(
    `SELECT id, isCustom, createdBy FROM dishes WHERE id = ?;`,
    [dishId]
  );
  if (!row || !row.isCustom || row.createdBy !== userId) return false;

  db!.runSync(`DELETE FROM dish_ingredients WHERE dishId = ?;`, [dishId]);
  db!.runSync(`DELETE FROM dishes WHERE id = ? AND isCustom = 1 AND createdBy = ?;`, [
    dishId,
    userId,
  ]);
  await removeMealPlanEntriesByDishId(dishId);
  return true;
}

/** Lets users correct an ingredient's price so future plans/lists are more accurate. */
export async function updateIngredientPrice(ingredientId: number, newPrice: number): Promise<void> {
  if (Platform.OS === 'web') {
    for (const bundle of allWebBundles()) {
      const ing = bundle.ingredients.find((i) => i.id === ingredientId);
      if (ing) {
        ing.estimatedPrice = newPrice;
        bundle.dish.estimatedCost = bundle.ingredients.reduce((s, i) => s + i.estimatedPrice, 0);
        saveWebCustomDishes(webCustomDishes);
        return;
      }
    }
    return;
  }
  const row = db!.getFirstSync<{ dishId: number }>(
    `SELECT dishId FROM dish_ingredients WHERE id = ?;`,
    [ingredientId]
  );
  db!.runSync(`UPDATE dish_ingredients SET estimatedPrice = ? WHERE id = ?;`, [newPrice, ingredientId]);
  if (row) {
    db!.runSync(
      `UPDATE dishes SET estimatedCost = (SELECT SUM(estimatedPrice) FROM dish_ingredients WHERE dishId = ?) WHERE id = ?;`,
      [row.dishId, row.dishId]
    );
  }
}
