import { create } from 'zustand';
import {
  getGroceryItems,
  replaceGroceryList,
  toggleGroceryItem,
  updateGroceryItemPrice,
  type GroceryItem,
} from '../services/database/groceryRepository';
import { generateGroceryList } from '../algorithms/groceryGenerator';
import { getMealPlanForUser } from '../services/database/mealPlanRepository';
import { getPantryItems } from '../services/database/pantryRepository';
import { getIngredientsForDishes } from '../services/database/dishIngredientRepository';

interface GroceryState {
  items: GroceryItem[];
  loadItems: (userId: number) => Promise<void>;
  regenerate: (userId: number) => Promise<void>;
  toggleItem: (id: number, isChecked: boolean, userId: number) => Promise<void>;
  editPrice: (id: number, newPrice: number, userId: number) => Promise<void>;
}

export const useGroceryStore = create<GroceryState>((set) => ({
  items: [],
  loadItems: async (userId) => set({ items: await getGroceryItems(userId) }),

  regenerate: async (userId) => {
    const mealPlan = await getMealPlanForUser(userId);
    const pantry = await getPantryItems(userId);
    const dishIds = [...new Set(mealPlan.map((e) => e.dishId))];
    const allIngredients = await getIngredientsForDishes(dishIds);

    const generated = generateGroceryList(mealPlan, allIngredients, pantry);
    await replaceGroceryList(userId, generated);
    set({ items: await getGroceryItems(userId) });
  },

  toggleItem: async (id, isChecked, userId) => {
    await toggleGroceryItem(id, isChecked);
    set({ items: await getGroceryItems(userId) });
  },

  editPrice: async (id, newPrice, userId) => {
    await updateGroceryItemPrice(id, newPrice);
    set({ items: await getGroceryItems(userId) });
  },
}));