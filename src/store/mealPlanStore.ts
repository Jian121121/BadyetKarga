import { create } from 'zustand';
import { getAllDishes, addMealPlanEntry, getMealPlanForUser, type Dish, type MealPlanEntry } from '../services/database/mealPlanRepository';

interface MealPlanState {
  dishes: Dish[];
  entries: MealPlanEntry[];
  selectedDay: string;
  selectedMealType: string;

  loadDishes: () => Promise<void>;
  loadEntries: (userId: number) => Promise<void>;
  planMeal: (userId: number, dishId: number, dayOfWeek: string, mealType: string) => Promise<void>;
  setSelection: (day: string, mealType: string) => void;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  dishes: [],
  entries: [],
  selectedDay: 'Mon',
  selectedMealType: 'breakfast',

  loadDishes: async () => set({ dishes: await getAllDishes() }),
  loadEntries: async (userId) => set({ entries: await getMealPlanForUser(userId) }),
  planMeal: async (userId, dishId, dayOfWeek, mealType) => {
    await addMealPlanEntry(userId, dishId, dayOfWeek, mealType);
    set({ entries: await getMealPlanForUser(userId) });
  },
  setSelection: (day, mealType) => set({ selectedDay: day, selectedMealType: mealType }),
}));