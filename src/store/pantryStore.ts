import { create } from 'zustand';
import {
  getPantryItems,
  deletePantryItem,
  clearPantryItems,
  upsertPantryItem,
  type PantryItem,
} from '../services/database/pantryRepository';
import { ingredientKey } from '../shared/utils/ingredientKey';

interface PantryState {
  items: PantryItem[];
  loadItems: (userId: number) => Promise<void>;
  /** Adds or updates (same ingredient by normalized name) a pantry item. */
  addItem: (userId: number, ingredientName: string, quantity: string) => Promise<void>;
  removeItem: (id: number, userId: number) => Promise<void>;
  clearAll: (userId: number) => Promise<void>;
  reset: () => void;
}

/** Pantry changes what needs buying; rebuild the grocery list and the planner's estimate. */
async function refreshGroceries(userId: number) {
  const { useGroceryStore } = await import('./groceryStore');
  await useGroceryStore.getState().regenerate(userId);
  const total = useGroceryStore.getState().items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const { useMealPlanStore } = await import('./mealPlanStore');
  useMealPlanStore.setState({ lastGroceryEstimate: total });
}

export const usePantryStore = create<PantryState>((set) => ({
  items: [],
  loadItems: async (userId) => set({ items: await getPantryItems(userId) }),
  addItem: async (userId, ingredientName, quantity) => {
    const name = ingredientName.trim();
    if (!name) throw new Error('Enter an ingredient name.');
    const key = ingredientKey(name);
    const existing = (await getPantryItems(userId)).find((item) => ingredientKey(item.ingredientName) === key);
    await upsertPantryItem(userId, existing?.ingredientName ?? name, quantity.trim() || 'on hand');
    set({ items: await getPantryItems(userId) });
    await refreshGroceries(userId);
  },
  removeItem: async (id, userId) => {
    await deletePantryItem(id);
    set({ items: await getPantryItems(userId) });
    await refreshGroceries(userId);
  },
  clearAll: async (userId) => {
    await clearPantryItems(userId);
    set({ items: [] });
    await refreshGroceries(userId);
  },
  reset: () => set({ items: [] }),
}));
