import { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  AppState,
  Image,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import FadeIn from '../../../shared/motion/FadeIn';
import { useAuthStore } from '../../../store/authStore';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { useGroceryStore } from '../../../store/groceryStore';
import {
  WEEK_MEALS,
  WEEK_DAYS,
  getWeekDateRangeLabel,
  dayLabelForWeek,
  getWeekStart,
  getPlanDays,
  msUntilNextWeekStart,
} from '../../../shared/utils/week';
import { formatEaters, type EaterInfo } from '../../../shared/utils/eaters';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import {
  PLAN_DURATION_OPTIONS,
  calculateBudgetBreakdown,
} from '../../../shared/utils/householdServing';
import { parseSelectedGoals } from '../../../services/database/householdRepository';
import { useState } from 'react';

type Props = NativeStackScreenProps<PlannerStackParamList, 'MealPlanner'>;

const MEAL_PILL: Record<string, { bg: string; fg: string }> = {
  breakfast: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  lunch: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
  snack: { bg: '#F7EAD0', fg: colors.onSecondaryContainer },
  dinner: { bg: colors.surfaceContainerHigh, fg: colors.onSurfaceVariant },
};

function EaterAvatars({ eaters, max = 4 }: { eaters: EaterInfo[]; max?: number }) {
  if (eaters.length === 0) return null;
  const shown = eaters.slice(0, max);
  const extra = eaters.length - shown.length;
  return (
    <View style={styles.avatarRow}>
      {shown.map((e, i) => (
        <View key={`${e.id}-${i}`} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -6 }]}>
          {e.avatarUri ? (
            <Image source={{ uri: e.avatarUri }} style={styles.miniAvatarImg} />
          ) : (
            <Text style={styles.miniAvatarInitial}>{e.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.miniAvatar, styles.miniAvatarMore, { marginLeft: -6 }]}>
          <Text style={styles.miniAvatarInitial}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MealPlannerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const saveHouseholdSettings = useHouseholdStore((s) => s.saveSettings);
  const groceryItems = useGroceryStore((s) => s.items);
  const weeklyActualSpend = useGroceryStore((s) => s.weeklyActualSpend);
  const loadGrocery = useGroceryStore((s) => s.loadItems);
  const {
    entries,
    loadEntries,
    loadDishes,
    setSelection,
    removeEntry,
    clearWeekPlan,
    generateWeek,
    autoFillDay,
    isGenerating,
    pendingNewWeekPrompt,
    dismissNewWeekPrompt,
    currentWeekStart,
    planDurationDays,
    setPlanDurationDays,
    lastGroceryEstimate,
    eatersBySlot,
    refreshEaters,
  } = useMealPlanStore();

  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [selectedDayQuick, setSelectedDayQuick] = useState<string>('Mon');
  const [selectedGenerationDays, setSelectedGenerationDays] = useState<string[]>([...WEEK_DAYS]);
  const scrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser) return;
    void loadDishes();
    void loadEntries(currentUser.id);
    void loadGrocery(currentUser.id);
  }, [currentUser?.id]);

  // Refresh plan + family whenever Planner is focused (catches week rollover + new members).
  useFocusEffect(
    useCallback(() => {
      if (!currentUser) return;
      void loadEntries(currentUser.id);
      void loadGrocery(currentUser.id);
      void refreshEaters(currentUser.id);
    }, [currentUser?.id, loadEntries, loadGrocery, refreshEaters])
  );

  // Live week reset while the app stays open across Monday midnight.
  useEffect(() => {
    if (!currentUser) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      timer = setTimeout(() => {
        void loadEntries(currentUser.id);
        void loadGrocery(currentUser.id);
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
        void loadEntries(currentUser.id);
        void loadGrocery(currentUser.id);
        void refreshEaters(currentUser.id);
      }
    });
    return () => sub.remove();
  }, [currentUser?.id]);

  const weekStart = currentWeekStart || getWeekStart();
  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const budgetBufferPct = settings?.budgetBufferPercentage ?? 0;
  const { reservedBuffer, usableBudget } = calculateBudgetBreakdown(weeklyBudget, budgetBufferPct);

  // Budget Health tracks grocery cost (pantry-aware), not raw dish sticker prices.
  const groceryTotal =
    groceryItems.length > 0
      ? groceryItems.reduce((s, i) => s + i.estimatedCost, 0)
      : lastGroceryEstimate;
  const remainingUsable = usableBudget - weeklyActualSpend - groceryTotal;

  const selectedGoals = parseSelectedGoals(settings);
  const handleDurationChange = (days: number) => {
    setPlanDurationDays(days);
    if (settings) void saveHouseholdSettings({ ...settings, planDurationDays: days });
  };

  const toggleGenerationDay = (day: string) => {
    setSelectedGenerationDays((previous) =>
      previous.includes(day) ? previous.filter((item) => item !== day) : [...previous, day]
    );
  };

  const generateSelectedDays = () => {
    if (selectedGenerationDays.length === 0) {
      notify('Choose at least one day', 'Select the days you want Auto-Plan to generate.');
      return;
    }
    setDurationModalOpen(false);
    void handleGenerate(planDurationDays, selectedGenerationDays);
  };

  const getEntry = (day: string, mealType: string) =>
    entries.find((e) => e.dayOfWeek === day && e.mealType === mealType);

  const slotEatersOf = (day: string, meal: string): EaterInfo[] => {
    if (eatersBySlot.size === 0) return [];
    return eatersBySlot.get(`${day}|${meal}`) ?? [];
  };

  const dayEatersOf = (day: string): EaterInfo[] => {
    if (eatersBySlot.size === 0) return [];
    const seen = new Set<number>();
    const list: EaterInfo[] = [];
    for (const meal of WEEK_MEALS) {
      for (const e of slotEatersOf(day, meal)) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        list.push(e);
      }
    }
    return list;
  };

  const openSlotsForDay = (day: string) =>
    WEEK_MEALS.filter((m) => {
      const eaters = slotEatersOf(day, m);
      if (eatersBySlot.size === 0) return !getEntry(day, m);
      return eaters.length > 0 && !getEntry(day, m);
    }).length;

  const handleSlotPress = (day: string, mealType: string) => {
    const eaters = slotEatersOf(day, mealType);
    if (eatersBySlot.size > 0 && eaters.length === 0) {
      notify(
        'Nobody available',
        'No family members are available for this meal. Update Weekly Availability in Profile.'
      );
      return;
    }
    setSelection(day, mealType);
    navigation.navigate('DishLibrary', { lockSlot: true });
  };

  const handleRemove = (entryId: number, dishName?: string) => {
    if (!currentUser) return;
    confirmAction(
      'Remove meal?',
      `Remove ${dishName ?? 'this dish'} from the plan?`,
      'Remove',
      () => void removeEntry(currentUser.id, entryId),
      { destructive: true }
    );
  };

  const handleClearWeek = () => {
    if (!currentUser) return;
    if (entries.length === 0) {
      notify('Planner already clear', 'There are no meals planned for this week.');
      return;
    }
    confirmAction(
      'Clear this week?',
      'Remove every planned meal for the current week and reset the meal-derived grocery estimate?',
      'Clear all meals',
      () => {
        void clearWeekPlan(currentUser.id)
          .then(() => notify('Week cleared', 'All meals were removed and grocery needs were reset.'))
          .catch(() => notify('Could not clear planner', 'Please try again.'));
      },
      { destructive: true }
    );
  };

  const handleGenerate = async (durationDays = planDurationDays, selectedDays?: string[]) => {
    if (!currentUser || isGenerating) return;
    setPlanDurationDays(durationDays);
    try {
      const result = await generateWeek(currentUser.id, selectedDays);
      const allergyNote =
        result.excludedByAllergy > 0
          ? ` · ${result.excludedByAllergy} dish${result.excludedByAllergy === 1 ? '' : 'es'} skipped for allergies`
          : '';
      notify(
        'Weekly plan ready!',
        `Planned ${result.entries.length} meals · grocery estimate ₱${result.estimatedGroceryCost.toFixed(
          2
        )}${allergyNote}.`
      );
    } catch {
      notify('Could not generate plan', 'Please try again.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>BadyetKarga</Text>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <FadeIn>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Weekly Planner</Text>
            <Text style={styles.dateRange}>{getWeekDateRangeLabel(weekStart)}</Text>
          </View>
          <Text style={styles.weekScopeLabel}>Monday to Sunday</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickDayRow}
        >
          {WEEK_DAYS.map((day) => {
            const isActive = selectedDayQuick === day;
            return (
              <Pressable
                key={day}
                onPress={() => {
                  setSelectedDayQuick(day);
                  const offset = dayOffsets.current[day];
                  if (offset !== undefined) {
                    scrollRef.current?.scrollTo({ y: Math.max(0, offset - spacing.sm), animated: true });
                  }
                }}
                style={[styles.quickDayChip, isActive && styles.quickDayChipActive]}
              >
                <Text style={isActive ? styles.quickDayChipTextActive : styles.quickDayChipText}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedGoals.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalBadgesRow}
          >
            {selectedGoals.map((g) => (
              <View key={g} style={styles.goalBadge}>
                <MaterialIcons name="check-circle" size={12} color={colors.primary} />
                <Text style={styles.goalBadgeText}>{g}</Text>
              </View>
            ))}
            {settings?.visitorBufferServings ? (
              <View style={[styles.goalBadge, styles.visitorBadge]}>
                <MaterialIcons name="group-add" size={12} color={colors.secondary} />
                <Text style={styles.visitorBadgeText}>
                  +{settings.visitorBufferServings} Visitor Buffer
                </Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        {pendingNewWeekPrompt && (
          <View style={styles.newWeekBanner}>
            <View style={styles.newWeekTextWrap}>
              <Text style={styles.newWeekTitle}>New week started</Text>
              <Text style={styles.newWeekBody}>
                Last week's plan was archived. Generate fresh dishes for this week?
              </Text>
            </View>
            <View style={styles.newWeekActions}>
              <Pressable
                onPress={() => currentUser && dismissNewWeekPrompt(currentUser.id)}
                style={styles.laterButton}
              >
                <Text style={styles.laterText}>Later</Text>
              </Pressable>
              <Pressable onPress={() => setDurationModalOpen(true)} style={styles.generatePill}>
                <Text style={styles.generatePillText}>Generate</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setDurationModalOpen(true)}
            disabled={isGenerating}
            style={[styles.primaryPill, isGenerating && styles.disabled]}
          >
            <MaterialIcons name="auto-awesome" size={18} color={colors.onPrimary} />
            <Text style={styles.primaryPillText}>
              {isGenerating ? 'Generating…' : 'Auto-Plan Meals'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('DishLibrary', { lockSlot: false })}
            style={styles.secondaryPill}
          >
            <MaterialIcons name="restaurant-menu" size={18} color={colors.primary} />
            <Text style={styles.secondaryPillText}>Browse Dishes</Text>
          </Pressable>
        </View>
        <Pressable onPress={handleClearWeek} style={styles.clearWeekButton}>
          <MaterialIcons name="delete-sweep" size={18} color={colors.error} />
          <Text style={styles.clearWeekText}>Clear all meals this week</Text>
        </Pressable>

        {WEEK_DAYS.map((day) => {
          const open = openSlotsForDay(day);
          const dayEaters = dayEatersOf(day);
          const isSelectedDay = selectedDayQuick === day;
          return (
            <View
              key={day}
              onLayout={(event) => {
                dayOffsets.current[day] = event.nativeEvent.layout.y;
              }}
              style={[styles.dayBlock, isSelectedDay && styles.dayBlockSelected]}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{dayLabelForWeek(weekStart, day)}</Text>
              </View>

              {WEEK_MEALS.map((meal) => {
                const entry = getEntry(day, meal);
                const pill = MEAL_PILL[meal];
                const slotEaters = slotEatersOf(day, meal);
                const namesLabel = formatEaters(slotEaters, 2);

                if (eatersBySlot.size > 0 && slotEaters.length === 0 && !entry) {
                  return (
                    <View key={meal} style={styles.unavailableSlot}>
                      <Text style={styles.unavailableText}>
                        {meal.charAt(0).toUpperCase() + meal.slice(1)} · nobody available
                      </Text>
                    </View>
                  );
                }

                if (!entry) {
                  return (
                    <Pressable
                      key={meal}
                      onPress={() => handleSlotPress(day, meal)}
                      style={styles.emptySlot}
                    >
                      <MaterialIcons name="add" size={20} color={colors.onSurfaceVariant} />
                      <View style={styles.emptySlotBody}>
                        <Text style={styles.emptySlotText} numberOfLines={1}>
                          {meal.charAt(0).toUpperCase() + meal.slice(1)}
                          {namesLabel ? ` · ${namesLabel}` : ''}
                        </Text>
                        <EaterAvatars eaters={slotEaters} max={3} />
                      </View>
                    </Pressable>
                  );
                }

                const servings = entry.servings ?? 4;
                const eatingCount = (slotEaters.length ? slotEaters : dayEaters).length;
                const eatingLabel = namesLabel || formatEaters(dayEaters, 2);
                const serveLabel =
                  eatingCount > 0
                    ? eatingCount === servings
                      ? `Good for ${eatingCount}`
                      : `For ${eatingCount} · recipe ${servings}`
                    : `Serves ${servings}`;
                return (
                  <Pressable
                    key={meal}
                    onPress={() => navigation.navigate('DishDetails', { dishId: String(entry.dishId), fromPlanner: true })}
                    style={styles.filledSlot}
                  >
                    <View style={[styles.mealPill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.mealPillText, { color: pill.fg }]}>
                        {meal.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.slotBody}>
                      <Text style={styles.dishName}>{entry.dishName}</Text>
                      <View style={styles.metaRow}>
                        <EaterAvatars eaters={slotEaters.length ? slotEaters : dayEaters} max={3} />
                        <Text style={styles.dishMeta} numberOfLines={1}>
                          {serveLabel}
                          {eatingLabel ? ` · ${eatingLabel}` : ''} · ₱{entry.estimatedCost ?? 0}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        navigation.navigate('DishDetails', { dishId: String(entry.dishId), fromPlanner: true });
                      }}
                      hitSlop={8}
                      accessibilityLabel={`View ingredients for ${entry.dishName}`}
                    >
                      <MaterialIcons name="menu-book" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemove(entry.id, entry.dishName)}
                      hitSlop={10}
                    >
                      <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </Pressable>
                );
              })}

              {open > 0 && open < 4 && (
                <View style={styles.autoFillRow}>
                  <Text style={styles.openSlotsText}>{open} Slots Open</Text>
                  <Pressable
                    onPress={() => currentUser && autoFillDay(currentUser.id, day)}
                    style={styles.autoFillButton}
                  >
                    <Text style={styles.autoFillText}>Auto-Fill Day</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {/* Budget Health Card with Full Breakdown */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetCardHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
            <Text style={styles.budgetStatus}>
              {weeklyBudget <= 0
                ? 'Set a weekly budget in Profile'
                : remainingUsable >= 0
                  ? `₱${remainingUsable.toFixed(0)} left after purchases and grocery needs`
                  : `₱${Math.abs(remainingUsable).toFixed(0)} over usable budget`}
            </Text>
          </View>

          <View style={styles.budgetGrid}>
            <View style={styles.budgetGridItem}>
              <Text style={styles.budgetMiniLabel}>TOTAL BUDGET</Text>
              <Text style={styles.budgetMiniValue}>₱{weeklyBudget.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetGridItem}>
              <Text style={styles.budgetMiniLabel}>RESERVED BUFFER ({budgetBufferPct}%)</Text>
              <Text style={styles.budgetMiniReserved}>₱{reservedBuffer.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetGridItem}>
              <Text style={styles.budgetMiniLabel}>AVAILABLE MEAL BUDGET</Text>
              <Text style={styles.budgetMiniUsable}>₱{usableBudget.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetGridItem}>
              <Text style={styles.budgetMiniLabel}>ESTIMATED CART NEEDS</Text>
              <Text style={styles.budgetMiniCost}>₱{groceryTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.budgetGridItem}>
              <Text style={styles.budgetMiniLabel}>ACTUAL PURCHASES</Text>
              <Text style={styles.budgetMiniCost}>₱{weeklyActualSpend.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.budgetRemainingRow}>
            <Text style={styles.budgetRemainingLabel}>LEFT AFTER PURCHASES + CART</Text>
            <Text
              style={[
                styles.budgetRemainingValue,
                remainingUsable < 0 && styles.budgetRemainingOver,
              ]}
            >
              ₱{remainingUsable.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.budgetBufferNote}>
            * ₱{reservedBuffer.toFixed(2)} buffer is protected and reserved for unexpected needs.
          </Text>
        </View>
        </FadeIn>
      </ScrollView>

      {/* Duration Selector Modal */}
      <Modal
        visible={durationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDurationModalOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Auto-Plan Days</Text>
            <Text style={styles.modalSubtitle}>Choose the days to generate. Other days will stay unchanged.</Text>
            {PLAN_DURATION_OPTIONS.map((opt) => {
              const selected = planDurationDays === opt.days;
              return (
                <Pressable
                  key={opt.label}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => handleDurationChange(opt.days)}
                >
                  <Text style={selected ? styles.optionTextSelected : styles.optionText}>
                    {opt.label}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
            <Text style={styles.modalSubtitle}>Selected days: {selectedGenerationDays.length}</Text>
            <View style={styles.generationDaysGrid}>
              {WEEK_DAYS.map((day) => {
                const selected = selectedGenerationDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleGenerationDay(day)}
                    style={[styles.generationDay, selected && styles.generationDaySelected]}
                  >
                    <Text style={selected ? styles.generationDayTextSelected : styles.generationDayText}>
                      {day}
                    </Text>
                    {selected && <MaterialIcons name="check" size={16} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={generateSelectedDays} style={styles.generateModalButton}>
              <Text style={styles.generateModalButtonText}>Generate Selected Days</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Pressable
        style={[styles.fab, { bottom: spacing.lg + insets.bottom }]}
        onPress={() => {
          navigation.navigate('DishLibrary', { lockSlot: false });
        }}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 44,
  },
  brand: { ...typography.titleLg, color: colors.onSurface, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.marginMobile, paddingBottom: 100 },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginTop: spacing.sm },
  dateRange: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  weekScopeLabel: { ...typography.labelLg, color: colors.onSurfaceVariant },
  budgetHint: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  newWeekBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  newWeekTextWrap: { gap: 4 },
  newWeekTitle: { ...typography.titleMd, fontSize: 16, color: colors.primary },
  newWeekBody: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  newWeekActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  laterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
  },
  laterText: { ...typography.titleMd, fontSize: 14, color: colors.onSurfaceVariant },
  generatePill: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  generatePillText: { ...typography.titleMd, fontSize: 14, color: colors.onPrimary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  clearWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearWeekText: { ...typography.labelLg, color: colors.error },
  primaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  primaryPillText: { ...typography.labelLg, fontSize: 13, color: colors.onPrimary },
  secondaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLowest,
  },
  secondaryPillText: { ...typography.labelLg, fontSize: 13, color: colors.primary },
  disabled: { opacity: 0.6 },
  quickDayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickDayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  quickDayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickDayChipText: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onSurface,
  },
  quickDayChipTextActive: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onPrimary,
  },
  dayBlock: { marginBottom: spacing.lg },
  dayBlockSelected: {
    borderRadius: radii.xl,
    padding: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayLabel: {
    ...typography.labelLg,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  peopleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '65%',
  },
  peopleText: { ...typography.labelLg, fontSize: 11, color: colors.primary, flexShrink: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniAvatarMore: { backgroundColor: colors.surfaceContainerHigh },
  miniAvatarImg: { width: 22, height: 22 },
  miniAvatarInitial: {
    ...typography.labelLg,
    fontSize: 9,
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  emptySlotBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  filledSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mealPill: {
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  mealPillText: { ...typography.labelLg, fontSize: 10, fontWeight: '700' },
  slotBody: { flex: 1 },
  dishName: { ...typography.titleMd, fontSize: 16, color: colors.onSurface },
  dishMeta: { ...typography.bodyMd, fontSize: 12, color: colors.secondary, marginTop: 2 },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLow,
    height: 56,
    marginBottom: spacing.sm,
  },
  emptySlotText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  unavailableSlot: {
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  unavailableText: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' },
  autoFillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  openSlotsText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  autoFillButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  autoFillText: { ...typography.labelLg, fontSize: 13, color: colors.onPrimary },
  budgetCard: {
    backgroundColor: '#f4f9f2',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  budgetStatus: { ...typography.titleMd, fontSize: 14, color: colors.onSurface, flex: 1 },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  budgetGridItem: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  budgetMiniLabel: {
    ...typography.labelLg,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.onSurfaceVariant,
  },
  budgetMiniValue: { ...typography.titleMd, fontSize: 14, color: colors.onSurface, marginTop: 2 },
  budgetMiniReserved: { ...typography.titleMd, fontSize: 14, color: colors.error, marginTop: 2 },
  budgetMiniUsable: { ...typography.titleMd, fontSize: 14, color: colors.primary, marginTop: 2 },
  budgetMiniCost: { ...typography.titleMd, fontSize: 14, color: colors.secondary, marginTop: 2 },
  budgetRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  budgetRemainingLabel: { ...typography.titleMd, fontSize: 13, color: colors.onSurface },
  budgetRemainingValue: { ...typography.headlineLgMobile, fontSize: 18, color: colors.primary },
  budgetRemainingOver: { color: colors.error },
  budgetBufferNote: {
    ...typography.bodyMd,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  durationSelectorText: { ...typography.labelLg, fontSize: 12, color: colors.primary },
  goalBadgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  goalBadgeText: { ...typography.labelLg, fontSize: 11, color: colors.onSurface },
  visitorBadge: {
    backgroundColor: '#fff4e6',
    borderColor: colors.secondary,
  },
  visitorBadgeText: { ...typography.labelLg, fontSize: 11, color: colors.secondary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.marginMobile,
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modalTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: 2 },
  modalSubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: spacing.sm },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLowest,
  },
  modalOptionSelected: { backgroundColor: colors.primaryContainer },
  optionText: { ...typography.bodyLg, color: colors.onSurface },
  optionTextSelected: { ...typography.titleMd, color: colors.primary },
  generationDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  generationDay: {
    minWidth: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  generationDaySelected: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  generationDayText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  generationDayTextSelected: { ...typography.labelLg, color: colors.primary },
  generateModalButton: {
    minHeight: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  generateModalButtonText: { ...typography.labelLg, color: colors.onPrimary },
  fab: {
    position: 'absolute',
    right: spacing.marginMobile,
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
