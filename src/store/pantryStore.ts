import { create } from 'zustand';
import { addPantryItem, getPantryItems, deletePantryItem, type PantryItem } from '../services/database/pantryRepository';

interface PantryState {
  items: PantryItem[];
  loadItems: (userId: number) => Promise<void>;
  addItem: (userId: number, ingredientName: string, quantity: string) => Promise<void>;
  removeItem: (id: number, userId: number) => Promise<void>;
}

export const usePantryStore = create<PantryState>((set) => ({
  items: [],
  loadItems: async (userId) => set({ items: await getPantryItems(userId) }),
  addItem: async (userId, ingredientName, quantity) => {
    await addPantryItem(userId, ingredientName, quantity);
    set({ items: await getPantryItems(userId) });
  },
  removeItem: async (id, userId) => {
    await deletePantryItem(id);
    set({ items: await getPantryItems(userId) });
  },
}));