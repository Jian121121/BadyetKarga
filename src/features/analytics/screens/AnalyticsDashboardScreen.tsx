import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, AppState, Pressable } from 'react-native';
import BrandLogo from '../../../shared/components/BrandLogo';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import {
  calculateBudgetBreakdown,
  calculateEffectiveServings,
  visitorServingsForMeal,
} from '../../../shared/utils/householdServing';
import { slotKey } from '../../../shared/utils/eaters';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useNotificationStore } from '../../../store/notificationStore';
import NotificationsModal from '../../../shared/components/NotificationsModal';
import FadeIn from '../../../shared/motion/FadeIn';
import { parseSelectedGoals } from '../../../services/database/householdRepository';
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from '../../../services/database/analyticsRepository';
import { calculateBudgetBuffer } from '../../../algorithms/budgetBufferCalculator';
import {
  calculateBufferStatus,
  calculateGoalProgress,
  calculateServingCost,
  type BufferState,
  type GoalStatus,
} from '../../../algorithms/householdInsights';

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const BUFFER_COPY: Record<BufferState, { label: string; color: string }> = {
  untouched: { label: 'Untouched', color: colors.primary },
  partial: { label: 'Partly used', color: colors.secondary },
  used: { label: 'Fully used', color: colors.error },
  exceeded: { label: 'Budget exceeded', color: colors.error },
};

const GOAL_STATUS_COLOR: Record<GoalStatus, string> = {
  good: colors.primary,
  warn: colors.secondary,
  none: colors.outline,
};

export default function AnalyticsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const groceryItems = useGroceryStore((s) => s.items);
  const loadGrocery = useGroceryStore((s) => s.loadItems);
  const entries = useMealPlanStore((s) => s.entries);
  const dishes = useMealPlanStore((s) => s.dishes);
  const eatersBySlot = useMealPlanStore((s) => s.eatersBySlot);
  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const bufferPercentage = settings?.budgetBufferPercentage ?? 0;
  const { usableBudget, reservedBuffer } = calculateBudgetBreakdown(weeklyBudget, bufferPercentage);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshNotifications = useNotificationStore((s) => s.refresh);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    const mealPlan = useMealPlanStore.getState();
    await Promise.all([
      loadGrocery(currentUser.id),
      mealPlan.dishes.length === 0 ? mealPlan.loadDishes() : Promise.resolve(),
      mealPlan.loadEntries(currentUser.id),
    ]);
    const live = useHouseholdStore.getState().settings;
    const budget = live?.weeklyBudget ?? 0;
    const breakdown = calculateBudgetBreakdown(budget, live?.budgetBufferPercentage ?? 0);
    const plannedSpend = useGroceryStore.getState().items.reduce((s, i) => s + i.estimatedCost, 0);
    const data = await getAnalyticsSummary(currentUser.id, {
      weeklyBudget: budget,
      usableBudget: breakdown.usableBudget,
      plannedSpend,
    });
    setSummary(data);
    await refreshNotifications(currentUser.id);
  }, [currentUser?.id, weeklyBudget, bufferPercentage, loadGrocery, refreshNotifications]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const basisSpend = summary?.basisSpend ?? 0;
  const isPlanned = summary?.spendBasis === 'planned';
  const visitors = settings?.visitorBufferServings ?? 0;

  const householdServings = calculateEffectiveServings({
    adults: settings?.adults ?? 1,
    children: settings?.children ?? 0,
    seniors: settings?.seniors ?? 0,
    infantsToddlers: settings?.infantsToddlers ?? 0,
  });

  const plannedServings = useMemo(
    () =>
      entries.reduce((sum, e) => {
        const eaters = eatersBySlot.get(slotKey(e.dayOfWeek, e.mealType))?.length ?? 0;
        return sum + (eaters > 0 ? eaters : Math.round(householdServings)) + visitorServingsForMeal(e.mealType, visitors);
      }, 0),
    [entries, eatersBySlot, householdServings, visitors]
  );

  const servingCost = calculateServingCost({ weekSpend: basisSpend, householdServings, plannedServings });

  const bufferStatus = useMemo(() => {
    const { visitorAdjustment } = calculateBudgetBuffer({
      weeklyBudget,
      selectedGoals: parseSelectedGoals(settings),
      adults: settings?.adults,
      children: settings?.children,
      seniors: settings?.seniors,
      infantsToddlers: settings?.infantsToddlers,
      visitorBufferServings: visitors,
    });
    return calculateBufferStatus({
      weekSpend: basisSpend,
      usableBudget,
      reservedBuffer,
      weeklyBudget,
      visitorAdjustmentPercent: visitorAdjustment,
    });
  }, [settings, weeklyBudget, visitors, basisSpend, usableBudget, reservedBuffer]);

  const goalProgress = useMemo(
    () =>
      calculateGoalProgress({
        goals: parseSelectedGoals(settings),
        entries,
        dishes,
        groceryItems,
        realTripsThisWeek: summary?.tripsThisWeek ?? 0,
        basisSpend,
        usableBudget,
      }),
    [settings, entries, dishes, groceryItems, summary?.tripsThisWeek, basisSpend, usableBudget]
  );

  const maxBar = Math.max(1, ...(summary?.weeklyBars.map((b) => b.amount) ?? [1]));
  const util = summary?.utilizationPercent ?? 0;
  const overBudget = (summary?.overBy ?? 0) > 0;
  const donutColor = overBudget ? colors.error : colors.primary;
  const remaining = Math.max(usableBudget - basisSpend, 0);
  const hasBars = (summary?.weeklyBars ?? []).some((b) => b.amount > 0);
  const accuracy = summary?.estimateAccuracy ?? null;
  const bufferCopy = BUFFER_COPY[bufferStatus.state];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <BrandLogo size={28} />
        <Pressable onPress={() => setNotifVisible(true)} hitSlop={10} style={styles.bell}>
          <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
        <Text style={styles.title}>Insights & Analytics</Text>
        <Text style={styles.subtitle}>How your household budget, meals, and goals are doing.</Text>

        {/* Money saved */}
        <View style={[styles.savedCard, (summary?.monthOverspent ?? 0) > 0 && styles.savedCardOver]}>
          <MaterialIcons
            name={(summary?.monthOverspent ?? 0) > 0 ? 'trending-down' : 'savings'}
            size={28}
            color={colors.onPrimary}
          />
          <View style={styles.savedText}>
            <Text style={styles.savedLabel}>
              {(summary?.monthOverspent ?? 0) > 0 ? 'Over Budget' : 'Money Saved'}
            </Text>
            <Text style={styles.savedPeriod}>This Month</Text>
            {summary?.hasMonthData ? (
              <>
                <Text style={styles.savedValue}>
                  {formatPeso((summary.monthOverspent > 0 ? summary.monthOverspent : summary.moneySaved))}
                </Text>
                {summary.moneySavedTrendPercent != null && (
                  <View style={styles.trendRow}>
                    <MaterialIcons
                      name={summary.moneySavedTrendPercent >= 0 ? 'arrow-upward' : 'arrow-downward'}
                      size={14}
                      color={colors.onPrimary}
                    />
                    <Text style={styles.trendText}>
                      {Math.abs(summary.moneySavedTrendPercent)}% vs last month (per week)
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.savedEmpty}>
                Finish a shopping trip to start tracking what you save.
              </Text>
            )}
          </View>
        </View>

        {/* Budget utilization */}
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Budget Utilization</Text>
            <View style={[styles.basisPill, isPlanned && styles.basisPillPlanned]}>
              <Text style={[styles.basisPillText, isPlanned && styles.basisPillTextPlanned]}>
                {isPlanned ? 'PLANNED' : 'ACTUAL'}
              </Text>
            </View>
          </View>
          <View style={styles.donutWrap}>
            <View style={styles.donutOuter}>
              {Array.from({ length: 36 }, (_, index) => {
                // Start at the top and travel toward the left.
                const angle = -index * 10;
                const radians = (angle * Math.PI) / 180;
                const radius = 60;
                const segmentSize = 6;
                const isUsed = index < Math.round((Math.min(util, 100) / 100) * 36);
                return (
                  <View
                    key={angle}
                    style={[
                      styles.donutSegment,
                      {
                        left: 67 + Math.sin(radians) * radius - segmentSize / 2,
                        top: 67 - Math.cos(radians) * radius - 7,
                        backgroundColor: isUsed ? donutColor : colors.surfaceContainerHigh,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              <View style={styles.donutInner}>
                <Text style={[styles.donutPercent, { color: donutColor }]}>{util}%</Text>
                <Text style={styles.donutUsed}>{isPlanned ? 'PLANNED' : 'USED'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.outlineVariant }]} />
              <Text style={styles.legendText}>
                Meal budget <Text style={styles.legendStrong}>{formatPeso(usableBudget)}</Text>
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: donutColor }]} />
              <Text style={styles.legendText}>
                {isPlanned ? 'Planned groceries' : 'Spent this week'}{' '}
                <Text style={styles.legendStrong}>{formatPeso(basisSpend)}</Text>
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: overBudget ? colors.error : colors.primaryContainer }]} />
              <Text style={styles.legendText}>
                {overBudget ? 'Over by ' : 'Remaining '}
                <Text style={[styles.legendStrong, overBudget && { color: colors.error }]}>
                  {formatPeso(overBudget ? summary!.overBy : remaining)}
                </Text>
              </Text>
            </View>
          </View>
        </Card>

        {/* Buffer status */}
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>Emergency Buffer</Text>
              <Text style={styles.cardHint}>
                {bufferPercentage}% of your weekly budget is held back for surprises.
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: `${bufferCopy.color}1f` }]}>
              <Text style={[styles.statusChipText, { color: bufferCopy.color }]}>{bufferCopy.label}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${bufferStatus.usedPercent}%`, backgroundColor: bufferCopy.color },
              ]}
            />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.statSmall}>
              Used <Text style={styles.legendStrong}>{formatPeso(bufferStatus.used)}</Text>
            </Text>
            <Text style={styles.statSmall}>
              Left <Text style={styles.legendStrong}>{formatPeso(bufferStatus.left)}</Text> of{' '}
              {formatPeso(bufferStatus.reserve)}
            </Text>
          </View>
          {bufferStatus.visitorReserve > 0 && (
            <View style={styles.inlineNote}>
              <MaterialIcons name="group-add" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.inlineNoteText}>
                Includes about {formatPeso(bufferStatus.visitorReserve)} for unexpected visitors ({visitors}{' '}
                extra serving{visitors === 1 ? '' : 's'} at lunch and dinner).
              </Text>
            </View>
          )}
          {bufferStatus.overTotal > 0 && (
            <View style={styles.inlineNote}>
              <MaterialIcons name="error-outline" size={16} color={colors.error} />
              <Text style={[styles.inlineNoteText, { color: colors.error }]}>
                {isPlanned ? 'Planned groceries go' : 'Spending went'} {formatPeso(bufferStatus.overTotal)} past
                your whole weekly budget.
              </Text>
            </View>
          )}
        </Card>

        {/* Cost per serving */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Cost per Serving</Text>
          <View style={styles.statGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>PER PERSON / DAY</Text>
              <Text style={styles.statValue}>{formatPeso(servingCost.perPersonPerDay)}</Text>
              <Text style={styles.statSub}>
                {householdServings} adult-equivalent{householdServings === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLabel}>PER MEAL SERVING</Text>
              <Text style={styles.statValue}>
                {servingCost.perServing != null ? formatPeso(servingCost.perServing) : '—'}
              </Text>
              <Text style={styles.statSub}>
                {plannedServings > 0 ? `${plannedServings} servings planned` : 'No meals planned yet'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardHint}>
            Based on {isPlanned ? 'your planned groceries' : "this week's actual spend"}.
          </Text>
        </Card>

        {/* Goal progress */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Goal Progress</Text>
          <Text style={[styles.cardHint, styles.cardHintSpaced]}>
            How this week's plan lines up with your household goals.
          </Text>
          {goalProgress.length === 0 ? (
            <Text style={styles.emptyInline}>Pick goals in Edit Household to track them here.</Text>
          ) : (
            goalProgress.map((goal) => (
              <View key={goal.key} style={styles.goalRow}>
                <View style={[styles.goalIcon, { backgroundColor: `${GOAL_STATUS_COLOR[goal.status]}1f` }]}>
                  <MaterialIcons name={goal.icon} size={18} color={GOAL_STATUS_COLOR[goal.status]} />
                </View>
                <View style={styles.flex1}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalTarget}>{goal.target}</Text>
                  </View>
                  <View style={styles.goalTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(goal.progress * 100)}%`,
                          backgroundColor: GOAL_STATUS_COLOR[goal.status],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.goalMetric}>{goal.metric}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Weekly spending */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Spending</Text>
          <View style={styles.barsRow}>
            {(summary?.weeklyBars ?? []).map((bar) => (
              <View key={bar.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${bar.amount > 0 ? Math.max(8, (bar.amount / maxBar) * 100) : 0}%`,
                        backgroundColor: bar.isToday ? colors.primary : colors.primaryFixedDim,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, bar.isToday && styles.barLabelActive]}>{bar.day}</Text>
              </View>
            ))}
          </View>
          {!hasBars && (
            <Text style={[styles.emptyInline, styles.cardHintSpaced]}>
              Complete a shopping trip to see daily spend.
            </Text>
          )}
          <View style={styles.weekSummary}>
            <Text style={styles.statSmall}>
              Spent <Text style={styles.legendStrong}>{formatPeso(summary?.weeklySpend ?? 0)}</Text>
            </Text>
            <Text style={styles.statSmall}>
              Planned <Text style={styles.legendStrong}>{formatPeso(summary?.plannedSpend ?? 0)}</Text>
            </Text>
            <Text style={styles.statSmall}>
              Today <Text style={styles.legendStrong}>{formatPeso(summary?.todaySpend ?? 0)}</Text>
            </Text>
          </View>
        </Card>

        {/* Estimated vs actual */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Estimated vs Actual</Text>
          {!accuracy ? (
            <Text style={styles.emptyInline}>
              Enter real prices in Shopping Mode to compare them with the app's estimates.
            </Text>
          ) : (
            <>
              <Text style={[styles.cardHint, styles.cardHintSpaced]}>
                {Math.abs(accuracy.diffPercent) <= 5
                  ? 'Estimates are close to what you really pay.'
                  : accuracy.diffPercent > 0
                    ? `You paid ${accuracy.diffPercent}% more than estimated over your last trips.`
                    : `You paid ${Math.abs(accuracy.diffPercent)}% less than estimated over your last trips.`}
              </Text>
              {accuracy.trips.map((trip) => {
                const diff = trip.actual - trip.estimated;
                return (
                  <View key={trip.id} style={styles.tripRow}>
                    <Text style={styles.tripDate}>{formatShortDate(trip.date)}</Text>
                    <Text style={styles.tripAmounts}>
                      {formatPeso(trip.estimated)} → <Text style={styles.legendStrong}>{formatPeso(trip.actual)}</Text>
                    </Text>
                    <Text
                      style={[
                        styles.tripDiff,
                        { color: diff > 0 ? colors.error : colors.primary },
                      ]}
                    >
                      {diff > 0 ? '+' : diff < 0 ? '−' : ''}
                      {formatPeso(Math.abs(diff))}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </Card>

        {/* Most purchased */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Most Purchased Ingredients</Text>
          {(summary?.mostPurchased ?? []).length === 0 ? (
            <Text style={styles.emptyInline}>No purchase history yet.</Text>
          ) : (
            summary!.mostPurchased.map((item) => (
              <View key={item.ingredientName} style={styles.ingredientRow}>
                <View style={styles.ingredientIcon}>
                  <MaterialIcons name="shopping-basket" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.ingredientName}>{item.ingredientName}</Text>
                  <Text style={styles.ingredientMeta}>
                    Bought {item.buyCount} time{item.buyCount === 1 ? '' : 's'} this month
                  </Text>
                </View>
                <Text style={styles.ingredientCost}>{formatPeso(item.totalSpend)}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Monthly trends */}
        <View style={styles.trendsHeader}>
          <Text style={styles.cardTitle}>Monthly Trends</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>{summary?.monthLabel ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.trendGrid}>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>PREDICTED SPEND</Text>
            <Text style={styles.trendValue}>{formatPeso(summary?.predictedSpend ?? 0)}</Text>
            <Text style={styles.trendSub}>
              {summary?.predictedBasis === 'history'
                ? 'From your average week.'
                : summary?.predictedBasis === 'plan'
                  ? "From this week's plan."
                  : 'No data yet.'}
            </Text>
          </View>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>TOP CATEGORY</Text>
            <Text style={[styles.trendValue, { color: colors.secondary }]} numberOfLines={1}>
              {summary?.categoryHigh?.name ?? '—'}
            </Text>
            <Text style={styles.trendSub}>
              {summary?.categoryHigh
                ? `${summary.categoryHigh.percent}% of this month's spend.`
                : 'No category data yet.'}
            </Text>
          </View>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>DAILY AVERAGE</Text>
            <Text style={styles.trendValue}>{formatPeso(summary?.dailyAverage ?? 0)}</Text>
            <Text style={styles.trendSub}>Target {formatPeso(summary?.dailyTarget ?? 0)}.</Text>
          </View>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>SHOPPING TRIPS</Text>
            <Text style={styles.trendValue}>{summary?.tripsThisMonth ?? 0}</Text>
            <Text style={styles.trendSub}>Completed this month.</Text>
          </View>
        </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    height: 44,
  },
  topSpacer: { width: 22 },
  bell: { padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.onError, fontSize: 9, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginTop: spacing.sm },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  savedCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  savedCardOver: { backgroundColor: colors.error },
  savedText: { flex: 1 },
  savedLabel: { ...typography.titleMd, fontSize: 16, color: colors.onPrimary },
  savedPeriod: { ...typography.labelLg, color: colors.onPrimary, opacity: 0.8 },
  savedValue: {
    ...typography.displayLg,
    fontSize: 32,
    lineHeight: 40,
    color: colors.onPrimary,
    marginTop: spacing.xs,
  },
  savedEmpty: { ...typography.bodyMd, color: colors.onPrimary, marginTop: spacing.xs },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText: { ...typography.labelLg, color: colors.onPrimary },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.titleMd, fontSize: 16, color: colors.onSurface, marginBottom: spacing.xs },
  cardHint: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant },
  cardHintSpaced: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  basisPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
  },
  basisPillPlanned: { backgroundColor: colors.secondaryContainer },
  basisPillText: { ...typography.labelLg, fontSize: 10, letterSpacing: 0.8, color: colors.onPrimaryContainer },
  basisPillTextPlanned: { color: colors.onSecondaryContainer },
  donutWrap: { alignItems: 'center', marginVertical: spacing.md },
  donutOuter: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutSegment: {
    position: 'absolute',
    width: 6,
    height: 14,
    borderRadius: 2,
  },
  donutInner: {
    alignItems: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center',
  },
  donutPercent: { ...typography.headlineLgMobile },
  donutUsed: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  legendRow: { gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  legendStrong: { ...typography.titleMd, fontSize: 14, color: colors.onSurface },
  statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusChipText: { ...typography.labelLg, fontSize: 11 },
  progressTrack: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', borderRadius: radii.full, alignSelf: 'flex-start' },
  statSmall: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant },
  inlineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  inlineNoteText: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, flex: 1 },
  statGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
  },
  statLabel: { ...typography.labelLg, fontSize: 10, letterSpacing: 0.8, color: colors.onSurfaceVariant },
  statValue: { ...typography.titleLg, color: colors.primary, marginTop: 4 },
  statSub: { ...typography.bodyMd, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalLabel: { ...typography.titleMd, fontSize: 14, color: colors.onSurface, flex: 1 },
  goalTarget: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  goalTrack: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
    marginVertical: 6,
  },
  goalMetric: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
    marginTop: spacing.xs,
  },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    overflow: 'hidden',
    minHeight: 40,
  },
  barFill: { width: '100%', borderRadius: radii.lg },
  barLabel: { ...typography.labelLg, fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 },
  barLabelActive: { color: colors.primary, fontWeight: '700' },
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  tripDate: { ...typography.labelLg, fontSize: 12, color: colors.onSurfaceVariant, width: 52 },
  tripAmounts: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, flex: 1 },
  tripDiff: { ...typography.titleMd, fontSize: 13 },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  ingredientIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientName: { ...typography.bodyLg, color: colors.onSurface },
  ingredientMeta: { ...typography.labelLg, color: colors.onSurfaceVariant },
  ingredientCost: { ...typography.titleMd, fontSize: 14, color: colors.secondary },
  emptyInline: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  monthPill: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.surfaceContainerLowest,
  },
  monthPillText: { ...typography.labelLg, color: colors.onSurface },
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  trendBlock: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  trendLabel: {
    ...typography.labelLg,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  trendValue: { ...typography.titleLg, color: colors.onSurface, marginTop: 4 },
  trendSub: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
});
