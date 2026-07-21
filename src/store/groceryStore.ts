import { create } from 'zustand';
import { getGroceryItems, replaceGroceryList, toggleGroceryItem, type GroceryItem } from '../services/database/groceryRepository';
import { generateGroceryList } from '../algorithms/groceryGenerator';
import { getMealPlanForUser } from '../services/database/mealPlanRepository';
import { getPantryItems } from '../services/database/pantryRepository';

interface GroceryState {
  items: GroceryItem[];
  loadItems: (userId: number) => Promise<void>;
  regenerate: (userId: number) => Promise<void>;
  toggleItem: (id: number, isChecked: boolean, userId: number) => Promise<void>;
}

export const useGroceryStore = create<GroceryState>((set) => ({
  items: [],
  loadItems: async (userId) => set({ items: await getGroceryItems(userId) }),
  regenerate: async (userId) => {
    const [mealPlan, pantry] = await Promise.all([getMealPlanForUser(userId), getPantryItems(userId)]);
    const generated = generateGroceryList(mealPlan, pantry);
    await replaceGroceryList(userId, generated);
    set({ items: await getGroceryItems(userId) });
  },
  toggleItem: async (id, isChecked, userId) => {
    await toggleGroceryItem(id, isChecked);
    set({ items: await getGroceryItems(userId) });
  },
}));