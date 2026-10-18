import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { MealPlanEntry } from './database/mealPlanRepository';
import type { GroceryItem } from './database/groceryRepository';
import { WEEK_DAYS, getWeekStart, parseLocalISODate } from '../shared/utils/week';

const CHANNEL_ID = 'meal-shopping-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function missingItemsForDish(dishName: string, groceryItems: GroceryItem[]): GroceryItem[] {
  const normalizedDish = dishName.toLowerCase();
  return groceryItems.filter(
    (item) =>
      !item.isChecked &&
      item.usedInDishes
        .split(',')
        .some((dish) => dish.trim().toLowerCase() === normalizedDish)
  );
}

export async function syncMealShoppingReminders(
  mealEntries: MealPlanEntry[],
  groceryItems: GroceryItem[],
  weekStart: string = getWeekStart()
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: false },
      });
      if (!requested.granted) return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Meal shopping reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
        vibrationPattern: [0, 100],
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const start = parseLocalISODate(weekStart);
    const entriesByDay = new Map<string, MealPlanEntry[]>();
    for (const entry of mealEntries) {
      const list = entriesByDay.get(entry.dayOfWeek) ?? [];
      list.push(entry);
      entriesByDay.set(entry.dayOfWeek, list);
    }

    for (const day of WEEK_DAYS) {
      const dayIndex = WEEK_DAYS.indexOf(day);
      const mealDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayIndex);
      if (mealDate <= now) continue;

      const entries = entriesByDay.get(day) ?? [];
      const missing = new Map<string, GroceryItem>();
      const dishes = new Set<string>();
      for (const entry of entries) {
        if (!entry.dishName) continue;
        const dishMissing = missingItemsForDish(entry.dishName, groceryItems);
        if (dishMissing.length === 0) continue;
        dishes.add(entry.dishName);
        for (const item of dishMissing) missing.set(item.ingredientName.toLowerCase(), item);
      }
      if (missing.size === 0) continue;

      const reminderDate = new Date(
        mealDate.getFullYear(),
        mealDate.getMonth(),
        mealDate.getDate() - 1,
        9,
        0,
        0,
        0
      );
      if (reminderDate <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Shop ahead for ${day}`,
          body: `${missing.size} ingredient${missing.size === 1 ? '' : 's'} still needed for ${[...dishes].join(', ')} tomorrow.`,
          data: { type: 'meal-shopping-reminder', day, route: 'shopping-mode' },
          color: '#78BE20',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Scheduled reminders are optional; the in-app notification feed remains available.
  }
}
