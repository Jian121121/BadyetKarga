import { create } from 'zustand';
import { getMealPlanForUser } from '../services/database/mealPlanRepository';
import { getGroceryItems } from '../services/database/groceryRepository';
import { getAppMeta, setAppMeta, META_KEYS } from '../services/database/appMetaRepository';
import { getWeekStart } from '../shared/utils/week';
import {
  buildNotifications,
  todayWeekDay,
  type AppNotification,
  type NotificationPrefs,
} from '../shared/utils/notifications';
import { useHouseholdStore } from './householdStore';
import { calculateBudgetBreakdown } from '../shared/utils/householdServing';
import { syncMealShoppingReminders } from '../services/notificationScheduler';

interface NotificationState {
  items: AppNotification[];
  readIds: string[];
  prefs: NotificationPrefs;
  unreadCount: number;

  loadPrefs: (userId: number) => Promise<void>;
  refresh: (userId: number) => Promise<void>;
  markAllRead: (userId: number) => Promise<void>;
  setMaster: (userId: number, value: boolean) => Promise<void>;
  setCategory: (
    userId: number,
    category: 'meals' | 'groceries' | 'budget',
    value: boolean
  ) => Promise<void>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  master: true,
  meals: true,
  groceries: true,
  budget: true,
};

function flag(value: string | null, fallback = true): boolean {
  if (value === null) return fallback;
  return value === '1';
}

function computeUnread(items: AppNotification[], readIds: string[]): number {
  const read = new Set(readIds);
  return items.filter((i) => !read.has(i.id)).length;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  readIds: [],
  prefs: DEFAULT_PREFS,
  unreadCount: 0,

  loadPrefs: async (userId) => {
    const [master, meals, groceries, budget, readRaw] = await Promise.all([
      getAppMeta(userId, META_KEYS.notificationsEnabled),
      getAppMeta(userId, META_KEYS.notifMeals),
      getAppMeta(userId, META_KEYS.notifGroceries),
      getAppMeta(userId, META_KEYS.notifBudget),
      getAppMeta(userId, META_KEYS.notifReadIds),
    ]);
    let readIds: string[] = [];
    try {
      readIds = readRaw ? (JSON.parse(readRaw) as string[]) : [];
    } catch {
      readIds = [];
    }
    set({
      prefs: {
        master: flag(master),
        meals: flag(meals),
        groceries: flag(groceries),
        budget: flag(budget),
      },
      readIds,
    });
  },

  refresh: async (userId) => {
    await get().loadPrefs(userId);
    const { prefs, readIds } = get();

    const settings = useHouseholdStore.getState().settings;
    const { usableBudget } = calculateBudgetBreakdown(
      settings?.weeklyBudget ?? 0,
      settings?.budgetBufferPercentage ?? 0
    );
    const [mealEntries, groceryItems, pendingRaw] = await Promise.all([
      getMealPlanForUser(userId),
      getGroceryItems(userId),
      getAppMeta(userId, META_KEYS.pendingNewWeekPrompt),
    ]);
    await syncMealShoppingReminders(mealEntries, groceryItems);

    const items = buildNotifications({
      weekStart: getWeekStart(),
      todayKey: todayWeekDay(),
      mealEntries,
      groceryItems,
      weeklyBudget: usableBudget,
      pendingNewWeekPrompt: pendingRaw === '1',
      prefs,
    });

    // Drop stale read ids that no longer map to a current notification
    const liveIds = new Set(items.map((i) => i.id));
    const prunedRead = readIds.filter((id) => liveIds.has(id));

    set({ items, readIds: prunedRead, unreadCount: computeUnread(items, prunedRead) });
  },

  markAllRead: async (userId) => {
    const { items } = get();
    const readIds = items.map((i) => i.id);
    await setAppMeta(userId, META_KEYS.notifReadIds, JSON.stringify(readIds));
    set({ readIds, unreadCount: 0 });
  },

  setMaster: async (userId, value) => {
    await setAppMeta(userId, META_KEYS.notificationsEnabled, value ? '1' : '0');
    set((s) => ({ prefs: { ...s.prefs, master: value } }));
    await get().refresh(userId);
  },

  setCategory: async (userId, category, value) => {
    const keyMap = {
      meals: META_KEYS.notifMeals,
      groceries: META_KEYS.notifGroceries,
      budget: META_KEYS.notifBudget,
    } as const;
    await setAppMeta(userId, keyMap[category], value ? '1' : '0');
    set((s) => ({ prefs: { ...s.prefs, [category]: value } }));
    await get().refresh(userId);
  },
}));
