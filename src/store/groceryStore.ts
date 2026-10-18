import { create } from 'zustand';
import {
  getGroceryItems,
  replaceGroceryList,
  toggleGroceryItem,
  updateGroceryItemPrice,
  updateGroceryItem,
  addGroceryItem,
  deleteGroceryItem,
  removeCheckedGroceryItems,
  type GroceryItem,
} from '../services/database/groceryRepository';
import { generateGroceryList } from '../algorithms/groceryGenerator';
import { getMealPlanForUser } from '../services/database/mealPlanRepository';
import { getPantryItems, upsertPantryItem } from '../services/database/pantryRepository';
import { getIngredientsForDishes } from '../services/database/dishIngredientRepository';
import { completeShoppingTrip, getTripsForUser } from '../services/database/purchaseRepository';
import { getWeekStart } from '../shared/utils/week';
import { useHouseholdStore } from './householdStore';
import { useMealPlanStore } from './mealPlanStore';
import { getFamilyMembers } from '../services/database/familyRepository';
import { getAvailabilityForMembers } from '../services/database/availabilityRepository';
import { buildEatersBySlot } from '../shared/utils/eaters';
import {
  calculateEffectiveServings,
  compositionFromMembers,
  visitorServingsForMeal,
} from '../shared/utils/householdServing';
import { syncMealShoppingReminders } from '../services/notificationScheduler';
import { getPriceMemory, rememberPrices } from '../services/database/priceMemoryRepository';
import { ingredientKey } from '../shared/utils/ingredientKey';
import { categorizeIngredient } from '../shared/constants/groceryCategories';

interface GroceryState {
  items: GroceryItem[];
  weeklyActualSpend: number;
  loadItems: (userId: number) => Promise<void>;
  regenerate: (userId: number) => Promise<void>;
  toggleItem: (id: number, isChecked: boolean, userId: number) => Promise<void>;
  editPrice: (id: number, newPrice: number, userId: number) => Promise<void>;
  updateItem: (
    id: number,
    userId: number,
    patch: { ingredientName?: string; quantity?: number; estimatedCost?: number }
  ) => Promise<void>;
  addManualItem: (userId: number, name: string, price: number) => Promise<void>;
  removeItem: (id: number, userId: number) => Promise<void>;
  /**
   * Completes shopping for checked items:
   * archives a trip, upserts pantry, removes checked rows from the list.
   */
  completeShopping: (
    userId: number,
    actualPrices: Record<number, number>
  ) => Promise<{ actualTotal: number; itemCount: number }>;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  items: [],
  weeklyActualSpend: 0,

  loadItems: async (userId) => {
    await useMealPlanStore.getState().ensureCurrentWeek(userId);
    const trips = await getTripsForUser(userId);
    const weekStart = getWeekStart();
    set({
      items: await getGroceryItems(userId),
      weeklyActualSpend: trips.filter((trip) => trip.weekStart === weekStart).reduce((sum, trip) => sum + trip.actualTotal, 0),
    });
  },

  regenerate: async (userId) => {
    await useMealPlanStore.getState().ensureCurrentWeek(userId);
    const mealPlan = await getMealPlanForUser(userId);
    const pantry = await getPantryItems(userId);
    const dishIds = [...new Set(mealPlan.map((e) => e.dishId))];
    const allIngredients = await getIngredientsForDishes(dishIds);
    const settings = useHouseholdStore.getState().settings;
    const members = await getFamilyMembers(userId);
    const availability = await getAvailabilityForMembers(members.map((member) => member.id));
    const eatersBySlot = buildEatersBySlot(availability, members);
    const householdServings = calculateEffectiveServings(compositionFromMembers(members));
    const plannedServingsBySlot = new Map<string, number>();
    for (const entry of mealPlan) {
      const availableEaters = eatersBySlot.get(`${entry.dayOfWeek}|${entry.mealType}`)?.length ?? 0;
      plannedServingsBySlot.set(
        `${entry.dayOfWeek}|${entry.mealType}`,
        (availableEaters > 0 ? availableEaters : householdServings) +
          visitorServingsForMeal(entry.mealType, settings?.visitorBufferServings ?? 0)
      );
    }

    const checkedKeys = new Set(
      (await getGroceryItems(userId))
        .filter((item) => item.isChecked && item.usedInDishes !== 'Added manually')
        .map((item) => ingredientKey(item.ingredientName))
    );
    const priceMemory = await getPriceMemory(userId);
    const generated = generateGroceryList(mealPlan, allIngredients, pantry, plannedServingsBySlot, priceMemory).map(
      (item) => ({ ...item, isChecked: checkedKeys.has(ingredientKey(item.ingredientName)) })
    );
    await replaceGroceryList(userId, generated, getWeekStart());
    const refreshedItems = await getGroceryItems(userId);
    const trips = await getTripsForUser(userId);
    set({
      items: refreshedItems,
      weeklyActualSpend: trips.filter((trip) => trip.weekStart === getWeekStart()).reduce((sum, trip) => sum + trip.actualTotal, 0),
    });
    await syncMealShoppingReminders(mealPlan, refreshedItems);
  },

  toggleItem: async (id, isChecked, userId) => {
    await toggleGroceryItem(id, isChecked);
    const refreshedItems = await getGroceryItems(userId);
    set({ items: refreshedItems });
    await syncMealShoppingReminders(await getMealPlanForUser(userId), refreshedItems);
  },

  editPrice: async (id, newPrice, userId) => {
    await updateGroceryItemPrice(id, newPrice);
    const item = get().items.find((i) => i.id === id);
    if (item) {
      await rememberPrices(userId, [
        { ingredientName: item.ingredientName, quantity: item.quantity, unit: item.unit, price: newPrice },
      ]);
    }
    set({ items: await getGroceryItems(userId) });
  },

  updateItem: async (id, userId, patch) => {
    await updateGroceryItem(userId, id, patch);
    set({ items: await getGroceryItems(userId) });
  },

  addManualItem: async (userId, name, price) => {
    await addGroceryItem(userId, name, price, getWeekStart(), categorizeIngredient(name));
    set({ items: await getGroceryItems(userId) });
  },

  removeItem: async (id, userId) => {
    await deleteGroceryItem(id);
    set({ items: await getGroceryItems(userId) });
  },

  completeShopping: async (userId, actualPrices) => {
    const items = get().items.filter((i) => i.isChecked);
    if (items.length === 0) {
      return { actualTotal: 0, itemCount: 0 };
    }

    const budget = useHouseholdStore.getState().settings?.weeklyBudget ?? 0;
    const tripItems = items.map((item) => {
      const actual =
        actualPrices[item.id] !== undefined && !isNaN(actualPrices[item.id])
          ? actualPrices[item.id]
          : item.estimatedCost;
      return {
        ingredientName: item.ingredientName,
        category: categorizeIngredient(item.ingredientName),
        quantity: item.quantity,
        unit: item.unit,
        estimatedCost: item.estimatedCost,
        actualCost: actual,
      };
    });

    await completeShoppingTrip({
      userId,
      budgetSnapshot: budget,
      items: tripItems,
      weekStart: getWeekStart(),
    });

    await rememberPrices(
      userId,
      items
        .filter((item) => actualPrices[item.id] !== undefined && !isNaN(actualPrices[item.id]))
        .map((item) => ({
          ingredientName: item.ingredientName,
          quantity: item.quantity,
          unit: item.unit,
          price: actualPrices[item.id],
        }))
    );

    for (const item of items) {
      await upsertPantryItem(
        userId,
        item.ingredientName,
        `${item.quantity} ${item.unit}`.trim()
      );
    }

    await removeCheckedGroceryItems(userId);
    const refreshedItems = await getGroceryItems(userId);
    const trips = await getTripsForUser(userId);
    set({
      items: refreshedItems,
      weeklyActualSpend: trips.filter((trip) => trip.weekStart === getWeekStart()).reduce((sum, trip) => sum + trip.actualTotal, 0),
    });
    await syncMealShoppingReminders(await getMealPlanForUser(userId), refreshedItems);

    return {
      actualTotal: tripItems.reduce((s, i) => s + i.actualCost, 0),
      itemCount: tripItems.length,
    };
  },
}));
