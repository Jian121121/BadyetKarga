import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, AppState, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { calculateBudgetBreakdown } from '../../../shared/utils/householdServing';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useNotificationStore } from '../../../store/notificationStore';
import NotificationsModal from '../../../shared/components/NotificationsModal';
import FadeIn from '../../../shared/motion/FadeIn';
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from '../../../services/database/analyticsRepository';

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AnalyticsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const groceryItems = useGroceryStore((s) => s.items);
  const loadGrocery = useGroceryStore((s) => s.loadItems);
  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const bufferPercentage = settings?.budgetBufferPercentage ?? 0;

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshNotifications = useNotificationStore((s) => s.refresh);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    await loadGrocery(currentUser.id);
    const budget = useHouseholdStore.getState().settings?.weeklyBudget ?? 0;
    const buffer = useHouseholdStore.getState().settings?.budgetBufferPercentage ?? 0;
    const { usableBudget } = calculateBudgetBreakdown(budget, buffer);
    const liveItems = useGroceryStore.getState().items;
    const liveGrocery = liveItems.reduce((s, i) => s + i.estimatedCost, 0);
    const data = await getAnalyticsSummary(currentUser.id, usableBudget, liveGrocery);
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

  const maxBar = Math.max(1, ...(summary?.weeklyBars.map((b) => b.amount) ?? [1]));
  const remaining = Math.max((summary?.weeklyBudget ?? weeklyBudget) - (summary?.weeklySpend ?? 0), 0);
  const util = summary?.utilizationPercent ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={styles.brand}>BadyetKarga</Text>
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
        <Text style={styles.subtitle}>Real-time overview of your household economy.</Text>

        <View style={styles.savedCard}>
          <MaterialIcons name="savings" size={28} color={colors.onPrimary} />
          <View style={styles.savedText}>
            <Text style={styles.savedLabel}>Money Saved</Text>
            <Text style={styles.savedPeriod}>This Month</Text>
            <Text style={styles.savedValue}>{formatPeso(summary?.moneySaved ?? 0)}</Text>
            {summary?.moneySavedTrendPercent != null && (
              <View style={styles.trendRow}>
                <MaterialIcons
                  name={summary.moneySavedTrendPercent >= 0 ? 'arrow-upward' : 'arrow-downward'}
                  size={14}
                  color={colors.onPrimary}
                />
                <Text style={styles.trendText}>
                  {Math.abs(summary.moneySavedTrendPercent)}% vs last month
                </Text>
              </View>
            )}
          </View>
        </View>

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
                        height: `${Math.max(8, (bar.amount / maxBar) * 100)}%`,
                        backgroundColor: bar.isToday ? colors.primary : colors.primaryContainer,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, bar.isToday && styles.barLabelActive]}>
                  {bar.day}
                </Text>
              </View>
            ))}
            {(summary?.weeklyBars.length ?? 0) === 0 && (
              <Text style={styles.emptyInline}>Complete a shopping trip to see daily spend.</Text>
            )}
          </View>
          <Text style={styles.weekTotal}>
            This week: {formatPeso(summary?.weeklySpend ?? 0)}
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Today's Market Spend</Text>
              <Text style={styles.cardHint}>Completed purchases recorded today</Text>
            </View>
            <MaterialIcons name="storefront" size={24} color={colors.primary} />
          </View>
          <Text style={styles.todaySpend}>{formatPeso(summary?.todaySpend ?? 0)}</Text>
          <Text style={styles.cardHint}>
            {summary?.todayTrips ?? 0} market trip{summary?.todayTrips === 1 ? '' : 's'} recorded
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Budget Utilization</Text>
          <View style={styles.donutWrap}>
            <View style={styles.donutOuter}>
              {Array.from({ length: 36 }, (_, index) => {
                const angle = index * 10;
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
                        backgroundColor: isUsed ? colors.primary : colors.surfaceContainerHigh,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              <View style={styles.donutInner}>
                <Text style={styles.donutPercent}>{util}%</Text>
                <Text style={styles.donutUsed}>USED</Text>
              </View>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>
                Grocery Budget{' '}
                <Text style={styles.legendStrong}>{formatPeso(summary?.weeklyBudget ?? 0)}</Text>
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.outlineVariant }]} />
              <Text style={styles.legendText}>
                Remaining <Text style={styles.legendStrong}>{formatPeso(remaining)}</Text>
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Most Purchased Ingredients</Text>
          </View>
          {(summary?.mostPurchased ?? []).length === 0 ? (
            <Text style={styles.emptyInline}>No purchase history yet.</Text>
          ) : (
            summary!.mostPurchased.map((item) => (
              <View key={item.ingredientName} style={styles.ingredientRow}>
                <View style={styles.ingredientIcon}>
                  <MaterialIcons name="shopping-basket" size={18} color={colors.primary} />
                </View>
                <View style={styles.ingredientInfo}>
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

        <View style={styles.trendsHeader}>
          <Text style={styles.cardTitle}>Monthly Trends</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>{summary?.monthLabel ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.trendBlocks}>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>PREDICTED SPEND</Text>
            <Text style={styles.trendValue}>{formatPeso(summary?.predictedSpend ?? 0)}</Text>
            <Text style={styles.trendSub}>Based on current trajectory.</Text>
          </View>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>CATEGORY HIGH</Text>
            <Text style={[styles.trendValue, { color: colors.secondary }]}>
              {summary?.categoryHigh?.name ?? '—'}
            </Text>
            <Text style={styles.trendSub}>
              {summary?.categoryHigh
                ? `${summary.categoryHigh.percent}% of total budget.`
                : 'No category data yet.'}
            </Text>
          </View>
          <View style={styles.trendBlock}>
            <Text style={styles.trendLabel}>DAILY AVERAGE</Text>
            <Text style={styles.trendValue}>{formatPeso(summary?.dailyAverage ?? 0)}</Text>
            <Text style={styles.trendSub}>
              Target is {formatPeso(summary?.dailyTarget ?? 0)}.
            </Text>
          </View>
        </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    height: 44,
  },
  topSpacer: { width: 22 },
  brand: { ...typography.titleLg, color: colors.onSurface },
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
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText: { ...typography.labelLg, color: colors.onPrimary },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.titleMd, fontSize: 16, color: colors.onSurface, marginBottom: spacing.sm },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
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
  weekTotal: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm },
  todaySpend: { ...typography.headlineLgMobile, color: colors.primary, marginTop: spacing.sm },
  cardHint: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
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
  donutPercent: { ...typography.headlineLgMobile, color: colors.primary },
  donutUsed: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  legendRow: { gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  legendStrong: { ...typography.titleMd, fontSize: 14, color: colors.onSurface },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  ingredientInfo: { flex: 1 },
  ingredientName: { ...typography.bodyLg, color: colors.onSurface },
  ingredientMeta: { ...typography.labelLg, color: colors.onSurfaceVariant },
  ingredientCost: { ...typography.titleMd, fontSize: 14, color: colors.secondary },
  emptyInline: { ...typography.bodyMd, color: colors.onSurfaceVariant },
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
  trendBlocks: { gap: spacing.sm, marginBottom: spacing.xl },
  trendBlock: {
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
  trendSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
});
