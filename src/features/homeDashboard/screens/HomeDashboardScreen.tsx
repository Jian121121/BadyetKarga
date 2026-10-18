import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  AppState,
  type ImageSourcePropType,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import type { MainTabParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { useFamilyStore } from '../../../store/familyStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useNotificationStore } from '../../../store/notificationStore';
import NotificationsModal from '../../../shared/components/NotificationsModal';
import HomeHeader from '../components/HomeHeader';
import WeeklyBudgetCard from '../components/WeeklyBudgetCard';
import QuickActions from '../components/QuickActions';
import FamilyCountCard from '../components/FamilyCountCard';
import MealCard from '../components/MealCard';
import { daysLeftInWeek, msUntilNextWeekStart } from '../../../shared/utils/week';
import { notify } from '../../../shared/utils/confirm';
import FadeIn from '../../../shared/motion/FadeIn';

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snack', label: 'Snack' },
  { key: 'dinner', label: 'Dinner' },
] as const;

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MEAL_IMAGES: ImageSourcePropType[] = [
  require('../../../../assets/wizard/meal-mixed.png'),
  require('../../../../assets/wizard/meal-filipino.png'),
  require('../../../../assets/wizard/meal-healthy.png'),
  require('../../../../assets/wizard/meal-budget.png'),
];

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function todayDayKey(): string {
  return DAY_KEYS[new Date().getDay()];
}

function imageForDish(dishName: string, slotIndex: number): ImageSourcePropType {
  const lower = dishName.toLowerCase();
  if (lower.includes('adobo') || lower.includes('filipino')) {
    return require('../../../../assets/wizard/meal-filipino.png');
  }
  if (lower.includes('sinigang') || lower.includes('salad') || lower.includes('fruit')) {
    return require('../../../../assets/wizard/meal-healthy.png');
  }
  if (lower.includes('stir') || lower.includes('budget')) {
    return require('../../../../assets/wizard/meal-budget.png');
  }
  if (lower.includes('quick') || lower.includes('egg') || lower.includes('rice')) {
    return require('../../../../assets/wizard/meal-quick.png');
  }
  return MEAL_IMAGES[slotIndex % MEAL_IMAGES.length];
}

export default function HomeDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const members = useFamilyStore((s) => s.members);
  const loadMembers = useFamilyStore((s) => s.loadMembers);
  const groceryItems = useGroceryStore((s) => s.items);
  const loadGroceryItems = useGroceryStore((s) => s.loadItems);
  const regenerateGrocery = useGroceryStore((s) => s.regenerate);
  const mealEntries = useMealPlanStore((s) => s.entries);
  const loadMealEntries = useMealPlanStore((s) => s.loadEntries);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshNotifications = useNotificationStore((s) => s.refresh);

  const [generating, setGenerating] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    void loadMembers(currentUser.id);
    void loadGroceryItems(currentUser.id);
    void loadMealEntries(currentUser.id);
    void refreshNotifications(currentUser.id);
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUser) return;
      void loadMealEntries(currentUser.id);
      void loadGroceryItems(currentUser.id);
    }, [currentUser?.id, loadMealEntries, loadGroceryItems])
  );

  useEffect(() => {
    if (!currentUser) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      timer = setTimeout(() => {
        void loadMealEntries(currentUser.id);
        void loadGroceryItems(currentUser.id);
        schedule();
      }, msUntilNextWeekStart());
    };
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && currentUser) {
        void loadMealEntries(currentUser.id);
        void loadGroceryItems(currentUser.id);
      }
    });
    return () => sub.remove();
  }, [currentUser?.id]);

  // Recompute the badge whenever meals or groceries change.
  useEffect(() => {
    if (currentUser) void refreshNotifications(currentUser.id);
  }, [currentUser?.id, mealEntries.length, groceryItems.length]);

  const firstName = currentUser?.fullName?.split(' ')[0] ?? 'there';
  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const spent = useMemo(
    () => groceryItems.reduce((sum, item) => sum + item.estimatedCost, 0),
    [groceryItems]
  );
  const familyCount = members.length;

  const todayKey = todayDayKey();
  const todaysMeals = useMemo(() => {
    return MEAL_SLOTS.map((slot, index) => {
      const entry = mealEntries.find(
        (e) =>
          e.dayOfWeek === todayKey &&
          e.mealType.toLowerCase() === slot.key
      );
      return {
        mealType: slot.label,
        dishName: entry?.dishName ?? `Add ${slot.label.toLowerCase()}`,
        empty: !entry,
        imageSource: entry?.dishName
          ? imageForDish(entry.dishName, index)
          : undefined,
      };
    });
  }, [mealEntries, todayKey]);

  const tabNavigate = useCallback(
    (tab: keyof MainTabParamList, screen?: string) => {
      const tabNav = navigation.getParent() as
        | BottomTabNavigationProp<MainTabParamList>
        | undefined;
      if (!tabNav) return;
      if (screen) {
        tabNav.navigate(tab, { screen, initial: false } as never);
      } else {
        tabNav.navigate(tab);
      }
    },
    [navigation]
  );

  const handleGenerateGrocery = async () => {
    if (!currentUser || generating) return;
    setGenerating(true);
    try {
      await regenerateGrocery(currentUser.id);
      notify('Grocery list ready', 'Your list was generated from this week\'s meal plan.');
      tabNavigate('GroceriesTab', 'GroceryList');
    } catch {
      notify('Could not generate list', 'Plan some meals first, then try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <HomeHeader
        onProfilePress={() => tabNavigate('ProfileTab')}
        onNotificationsPress={() => setNotifVisible(true)}
        unreadCount={unreadCount}
        avatarUri={currentUser?.avatarUri}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
        <Text style={styles.greeting}>
          {greetingForNow()}, {firstName}
        </Text>
        <Text style={styles.subGreeting}>Here's your household overview for today.</Text>

        <View style={styles.row}>
          <WeeklyBudgetCard
            spent={spent}
            total={weeklyBudget}
            daysLeft={daysLeftInWeek()}
            bufferPercentage={settings?.budgetBufferPercentage ?? 0}
            visitorBufferServings={settings?.visitorBufferServings ?? 0}
            onPress={() => tabNavigate('ProfileTab', 'EditHousehold')}
          />
        </View>

        <View style={styles.row}>
          <QuickActions
            generating={generating}
            onPlanMeals={() => tabNavigate('PlannerTab')}
            onGenerateGroceryList={handleGenerateGrocery}
            onShoppingMode={() => tabNavigate('GroceriesTab', 'ShoppingMode')}
          />
        </View>

        <View style={styles.row}>
          <FamilyCountCard count={familyCount} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Pressable
            onPress={() => tabNavigate('PlannerTab')}
            style={styles.viewSchedule}
            hitSlop={8}
          >
            <Text style={styles.viewScheduleText}>View Schedule</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.mealsGrid}>
          {todaysMeals.map((meal) => (
            <MealCard
              key={meal.mealType}
              mealType={meal.mealType}
              dishName={meal.dishName}
              imageSource={meal.imageSource}
              empty={meal.empty}
              onPress={() => tabNavigate('PlannerTab')}
            />
          ))}
        </View>
        </FadeIn>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: 16 }]}
        onPress={() => tabNavigate('PlannerTab')}
        accessibilityLabel="Add meal"
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
  },
  greeting: {
    ...typography.headlineLgMobile,
    fontSize: 28,
    lineHeight: 36,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  row: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  viewSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewScheduleText: {
    ...typography.titleMd,
    fontSize: 14,
    color: colors.primary,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.marginMobile,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
