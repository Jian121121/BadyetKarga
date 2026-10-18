import type { MaterialIcons } from '@expo/vector-icons';
import type { MealPlanEntry } from '../../services/database/mealPlanRepository';
import type { GroceryItem } from '../../services/database/groceryRepository';
import { WEEK_DAYS, WEEK_MEALS } from './week';

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;

export type NotificationCategory = 'meals' | 'groceries' | 'budget' | 'system';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  timestamp: number;
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(timestamp).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export interface NotificationPrefs {
  master: boolean;
  meals: boolean;
  groceries: boolean;
  budget: boolean;
}

export interface BuildNotificationsInput {
  weekStart: string;
  todayKey: string;
  mealEntries: MealPlanEntry[];
  groceryItems: GroceryItem[];
  weeklyBudget: number;
  pendingNewWeekPrompt: boolean;
  prefs: NotificationPrefs;
}

/** Today's weekday in Mon–Sun form used across the planner. */
export function todayWeekDay(date: Date = new Date()): string {
  const d = date.getDay(); // 0 Sun … 6 Sat
  return d === 0 ? 'Sun' : WEEK_DAYS[d - 1];
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

function nextWeekDay(day: string): string {
  const index = WEEK_DAYS.indexOf(day as (typeof WEEK_DAYS)[number]);
  return index >= 0 ? WEEK_DAYS[(index + 1) % WEEK_DAYS.length] : WEEK_DAYS[0];
}

/**
 * Builds the live in-app notification feed from real household data.
 * Pure function — respects master + per-category preferences.
 */
export function buildNotifications(input: BuildNotificationsInput): AppNotification[] {
  const {
    weekStart,
    todayKey,
    mealEntries,
    groceryItems,
    weeklyBudget,
    pendingNewWeekPrompt,
    prefs,
  } = input;

  if (!prefs.master) return [];

  const out: AppNotification[] = [];

  // 1. System — new week prompt
  if (pendingNewWeekPrompt) {
    out.push({
      id: `system-newweek-${weekStart}`,
      category: 'system',
      title: 'New week started',
      body: "Last week was archived. Generate this week's meal plan to get going.",
      icon: 'event-repeat',
      timestamp: Date.now(),
    });
  }

  // Shopping reminder: tomorrow's meals still have linked grocery items to buy.
  if (prefs.groceries && todayKey !== 'Sun') {
    const tomorrowKey = nextWeekDay(todayKey);
    const tomorrowMeals = mealEntries.filter((entry) => entry.dayOfWeek === tomorrowKey);
    const missingForTomorrow = tomorrowMeals.flatMap((entry) => {
      const dishName = (entry.dishName ?? '').toLowerCase();
      return groceryItems.filter(
        (item) =>
          !item.isChecked &&
          dishName.length > 0 &&
          item.usedInDishes
            .split(',')
            .some((dish) => dish.trim().toLowerCase() === dishName)
      );
    });
    const uniqueMissing = new Map(
      missingForTomorrow.map((item) => [item.ingredientName.toLowerCase(), item])
    );
    if (uniqueMissing.size > 0) {
      const dishNames = [...new Set(tomorrowMeals.map((entry) => entry.dishName).filter(Boolean))];
      out.push({
        id: `grocery-tomorrow-${weekStart}-${tomorrowKey}`,
        category: 'groceries',
        title: `Shop ahead for ${tomorrowKey}`,
        body: `${uniqueMissing.size} ingredient${uniqueMissing.size === 1 ? '' : 's'} still needed for ${dishNames.join(', ')} tomorrow.`,
        icon: 'shopping-cart',
        timestamp: Date.now() - 10 * 60 * 1000,
      });
    }
  }

  // 2. Meals — today's planned meals
  if (prefs.meals) {
    for (const meal of WEEK_MEALS) {
      const entry = mealEntries.find(
        (e) => e.dayOfWeek === todayKey && e.mealType.toLowerCase() === meal
      );
      if (entry) {
        const serves = entry.servings ?? 4;
        out.push({
          id: `meal-${weekStart}-${todayKey}-${meal}`,
          category: 'meals',
          title: `Today's ${MEAL_LABELS[meal] ?? meal}: ${entry.dishName ?? 'Planned dish'}`,
          body: `Serves ${serves}. Tap Planner to see the full day.`,
          icon: 'restaurant',
          timestamp: Date.now() - 5 * 60 * 1000,
        });
      }
    }

    // Unplanned reminder if today has nothing planned
    const plannedToday = mealEntries.filter((e) => e.dayOfWeek === todayKey).length;
    if (plannedToday === 0) {
      out.push({
        id: `meal-empty-${weekStart}-${todayKey}`,
        category: 'meals',
        title: 'No meals planned for today',
        body: 'Open the Weekly Planner to add or auto-fill today.',
        icon: 'no-meals',
        timestamp: Date.now() - 25 * 60 * 1000,
      });
    }
  }

  // 3. Groceries — pending items / ready to complete
  if (prefs.groceries && groceryItems.length > 0) {
    const unchecked = groceryItems.filter((i) => !i.isChecked);
    const checked = groceryItems.filter((i) => i.isChecked);
    const uncheckedTotal = unchecked.reduce((s, i) => s + i.estimatedCost, 0);

    if (unchecked.length > 0) {
      out.push({
        id: `grocery-pending-${weekStart}-${unchecked.length}`,
        category: 'groceries',
        title: `${unchecked.length} item${unchecked.length === 1 ? '' : 's'} left to buy`,
        body: `About ${peso(uncheckedTotal)} still on your grocery list this week.`,
        icon: 'shopping-cart',
        timestamp: Date.now() - 35 * 60 * 1000,
      });
    } else if (checked.length > 0) {
      out.push({
        id: `grocery-ready-${weekStart}`,
        category: 'groceries',
        title: 'Ready to complete your shopping trip',
        body: 'All items are checked. Finish in Shopping Mode to update pantry & analytics.',
        icon: 'task-alt',
        timestamp: Date.now() - 60 * 60 * 1000,
      });
    }
  }

  // 4. Budget — over / under this week
  if (prefs.budget && weeklyBudget > 0 && groceryItems.length > 0) {
    const total = groceryItems.reduce((s, i) => s + i.estimatedCost, 0);
    const diff = weeklyBudget - total;
    if (diff < 0) {
      out.push({
        id: `budget-over-${weekStart}-${Math.round(total)}`,
        category: 'budget',
        title: `Over budget by ${peso(Math.abs(diff))}`,
        body: `This week's groceries (${peso(total)}) exceed your ${peso(weeklyBudget)} usable grocery budget. Try Optimize Budget.`,
        icon: 'warning-amber',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
      });
    } else {
      out.push({
        id: `budget-ok-${weekStart}-${Math.round(total)}`,
        category: 'budget',
        title: `You're ${peso(diff)} under budget`,
        body: `Groceries at ${peso(total)} of your ${peso(weeklyBudget)} usable grocery budget.`,
        icon: 'savings',
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
      });
    }
  }

  return out.sort((a, b) => b.timestamp - a.timestamp);
}
