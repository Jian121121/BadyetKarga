import { getWeekStart, toLocalISODate } from '../../shared/utils/week';
import {
  getAllPurchasesForUser,
  getTripsForUser,
  type PurchaseItem,
  type ShoppingTrip,
} from './purchaseRepository';

/** Name of the placeholder line saved when a week ends without a completed shopping trip. */
export const ESTIMATE_ITEM_NAME = 'Weekly grocery estimate';

export interface AnalyticsInput {
  /** Full weekly budget, including the reserve. */
  weeklyBudget: number;
  /** Weekly budget minus the reserved buffer (what meals should cost). */
  usableBudget: number;
  /** Live grocery-list estimate for the open week (matches Planner Budget Health). */
  plannedSpend: number;
}

export interface TripAccuracy {
  id: number;
  date: string;
  estimated: number;
  actual: number;
}

export interface AnalyticsSummary {
  /** Budget left unspent this month across weeks with recorded spend (reserve included). */
  moneySaved: number;
  /** How far over budget the month is, when spend exceeded the weekly budgets. */
  monthOverspent: number;
  hasMonthData: boolean;
  moneySavedTrendPercent: number | null;

  /** Real spend from completed shopping trips this week. */
  weeklySpend: number;
  plannedSpend: number;
  /** Spend the budget cards use: actual once a trip exists, otherwise the plan. */
  basisSpend: number;
  spendBasis: 'actual' | 'planned';
  tripsThisWeek: number;
  todaySpend: number;
  todayTrips: number;

  weeklyBudget: number;
  usableBudget: number;
  utilizationPercent: number;
  overBy: number;

  weeklyBars: Array<{ day: string; amount: number; isToday: boolean }>;
  mostPurchased: Array<{ ingredientName: string; buyCount: number; totalSpend: number }>;
  predictedSpend: number;
  predictedBasis: 'history' | 'plan' | 'none';
  categoryHigh: { name: string; percent: number } | null;
  dailyAverage: number;
  dailyTarget: number;
  monthLabel: string;
  tripsThisMonth: number;

  estimateAccuracy: {
    trips: TripAccuracy[];
    totalEstimated: number;
    totalActual: number;
    /** Positive = spent more than estimated. */
    diffPercent: number;
  } | null;
}

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local-time YYYY-MM so early-morning trips on the 1st land in the right month. */
function localMonthKey(d: Date): string {
  return toLocalISODate(d).slice(0, 7);
}

function tripMonthKey(trip: ShoppingTrip): string {
  return localMonthKey(new Date(trip.completedAt));
}

function estimateTripIds(purchases: PurchaseItem[], trips: ShoppingTrip[]): Set<number> {
  const linesByTrip = new Map<number, PurchaseItem[]>();
  for (const p of purchases) {
    const list = linesByTrip.get(p.tripId) ?? [];
    list.push(p);
    linesByTrip.set(p.tripId, list);
  }
  const ids = new Set<number>();
  for (const trip of trips) {
    const lines = linesByTrip.get(trip.id) ?? [];
    if (lines.length > 0 && lines.every((l) => l.ingredientName === ESTIMATE_ITEM_NAME)) ids.add(trip.id);
  }
  return ids;
}

/** Sum of (weekly budget − spend) over the weeks that have recorded spend. */
function monthNet(trips: ShoppingTrip[], fallbackBudget: number): { net: number; weeks: number; spend: number } {
  const byWeek = new Map<string, { budget: number; spend: number }>();
  for (const t of trips) {
    const week = byWeek.get(t.weekStart) ?? { budget: 0, spend: 0 };
    week.budget = Math.max(week.budget, t.budgetSnapshot > 0 ? t.budgetSnapshot : fallbackBudget);
    week.spend += t.actualTotal;
    byWeek.set(t.weekStart, week);
  }
  let net = 0;
  let spend = 0;
  for (const w of byWeek.values()) {
    net += w.budget - w.spend;
    spend += w.spend;
  }
  return { net, weeks: byWeek.size, spend };
}

export async function getAnalyticsSummary(
  userId: number,
  { weeklyBudget, usableBudget, plannedSpend }: AnalyticsInput
): Promise<AnalyticsSummary> {
  const trips = await getTripsForUser(userId);
  const purchases = await getAllPurchasesForUser(userId);
  const estimateIds = estimateTripIds(purchases, trips);
  const realPurchases = purchases.filter((p) => !estimateIds.has(p.tripId));

  const weekStart = getWeekStart();
  const now = new Date();
  const thisMonth = localMonthKey(now);
  const prevMonth = localMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const todayKey = toLocalISODate(now);

  const tripsThisWeek = trips.filter((t) => t.weekStart === weekStart);
  const tripsThisMonth = trips.filter((t) => tripMonthKey(t) === thisMonth);
  const tripsToday = trips.filter((t) => toLocalISODate(new Date(t.completedAt)) === todayKey);
  const realTripsThisWeek = tripsThisWeek.filter((t) => !estimateIds.has(t.id));

  const weeklySpend = tripsThisWeek.reduce((s, t) => s + t.actualTotal, 0);
  const planned = Math.max(0, plannedSpend);
  const spendBasis: AnalyticsSummary['spendBasis'] = weeklySpend > 0 ? 'actual' : 'planned';
  const basisSpend = spendBasis === 'actual' ? weeklySpend : planned;
  const todaySpend = tripsToday.reduce((s, t) => s + t.actualTotal, 0);

  const month = monthNet(tripsThisMonth, weeklyBudget);
  const hasMonthData = month.weeks > 0;
  const moneySaved = Math.max(0, month.net);
  const monthOverspent = Math.max(0, -month.net);

  let moneySavedTrendPercent: number | null = null;
  const prev = monthNet(trips.filter((t) => tripMonthKey(t) === prevMonth), weeklyBudget);
  if (hasMonthData && prev.weeks > 0) {
    // Compare per-week savings so a partial month isn't penalised against a full one.
    const thisPerWeek = month.net / month.weeks;
    const prevPerWeek = prev.net / prev.weeks;
    if (prevPerWeek > 0) {
      moneySavedTrendPercent = Math.round(((thisPerWeek - prevPerWeek) / prevPerWeek) * 100);
    }
  }

  const utilizationPercent = usableBudget > 0 ? Math.round((basisSpend / usableBudget) * 100) : 0;
  const overBy = Math.max(0, basisSpend - usableBudget);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let predictedSpend = 0;
  let predictedBasis: AnalyticsSummary['predictedBasis'] = 'none';
  if (hasMonthData) {
    predictedSpend = (month.spend / month.weeks) * (daysInMonth / 7);
    predictedBasis = 'history';
  } else if (planned > 0) {
    predictedSpend = planned * (daysInMonth / 7);
    predictedBasis = 'plan';
  }

  const daysElapsed = Math.max(1, now.getDate());

  return {
    moneySaved,
    monthOverspent,
    hasMonthData,
    moneySavedTrendPercent,
    weeklySpend,
    plannedSpend: planned,
    basisSpend,
    spendBasis,
    tripsThisWeek: realTripsThisWeek.length,
    todaySpend,
    todayTrips: tripsToday.length,
    weeklyBudget,
    usableBudget,
    utilizationPercent,
    overBy,
    weeklyBars: buildWeeklyBars(tripsThisWeek),
    mostPurchased: aggregateMostPurchased(realPurchases, tripsThisMonth).slice(0, 5),
    predictedSpend,
    predictedBasis,
    categoryHigh: topCategory(realPurchases, tripsThisMonth),
    dailyAverage: month.spend / daysElapsed,
    dailyTarget: usableBudget > 0 ? usableBudget / 7 : 0,
    monthLabel: now.toLocaleDateString('en-US', { month: 'long' }),
    tripsThisMonth: tripsThisMonth.filter((t) => !estimateIds.has(t.id)).length,
    estimateAccuracy: buildEstimateAccuracy(trips.filter((t) => !estimateIds.has(t.id))),
  };
}

function buildWeeklyBars(trips: ShoppingTrip[]) {
  const amounts = new Array(7).fill(0);
  for (const trip of trips) {
    const day = new Date(trip.completedAt).getDay(); // 0 Sun
    amounts[day === 0 ? 6 : day - 1] += trip.actualTotal;
  }
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  return WEEK_DAY_LABELS.map((day, i) => ({ day, amount: amounts[i], isToday: i === todayIdx }));
}

function aggregateMostPurchased(purchases: PurchaseItem[], monthTrips: ShoppingTrip[]) {
  const tripIds = new Set(monthTrips.map((t) => t.id));
  const map = new Map<string, { ingredientName: string; buyCount: number; totalSpend: number }>();
  for (const p of purchases) {
    if (!tripIds.has(p.tripId)) continue;
    const existing = map.get(p.normalizedName);
    if (existing) {
      existing.buyCount += 1;
      existing.totalSpend += p.actualCost;
    } else {
      map.set(p.normalizedName, { ingredientName: p.ingredientName, buyCount: 1, totalSpend: p.actualCost });
    }
  }
  return [...map.values()].sort((a, b) => b.buyCount - a.buyCount || b.totalSpend - a.totalSpend);
}

function topCategory(purchases: PurchaseItem[], monthTrips: ShoppingTrip[]): { name: string; percent: number } | null {
  const tripIds = new Set(monthTrips.map((t) => t.id));
  const byCat = new Map<string, number>();
  let total = 0;
  for (const p of purchases) {
    if (!tripIds.has(p.tripId)) continue;
    byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.actualCost);
    total += p.actualCost;
  }
  if (total <= 0) return null;
  let best: { name: string; amount: number } | null = null;
  for (const [name, amount] of byCat) {
    if (!best || amount > best.amount) best = { name, amount };
  }
  return best ? { name: best.name, percent: Math.round((best.amount / total) * 100) } : null;
}

function buildEstimateAccuracy(realTrips: ShoppingTrip[]): AnalyticsSummary['estimateAccuracy'] {
  const recent = realTrips
    .filter((t) => t.estimatedTotal > 0)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 4);
  if (recent.length === 0) return null;
  const totalEstimated = recent.reduce((s, t) => s + t.estimatedTotal, 0);
  const totalActual = recent.reduce((s, t) => s + t.actualTotal, 0);
  return {
    trips: recent.map((t) => ({
      id: t.id,
      date: t.completedAt,
      estimated: t.estimatedTotal,
      actual: t.actualTotal,
    })),
    totalEstimated,
    totalActual,
    diffPercent: Math.round(((totalActual - totalEstimated) / totalEstimated) * 100),
  };
}

/** Lightweight snapshot used when rolling to a new week without a completed trip. */
export async function archiveEstimatedWeekSpend(
  userId: number,
  budgetSnapshot: number,
  estimatedTotal: number,
  weekStart: string
): Promise<void> {
  if (estimatedTotal <= 0) return;
  // Only archive if there is no trip already for that week
  const trips = await getTripsForUser(userId);
  if (trips.some((t) => t.weekStart === weekStart)) return;

  const { completeShoppingTrip } = await import('./purchaseRepository');
  await completeShoppingTrip({
    userId,
    budgetSnapshot,
    weekStart,
    items: [
      {
        ingredientName: ESTIMATE_ITEM_NAME,
        category: 'Grocery',
        quantity: 1,
        unit: 'week',
        estimatedCost: estimatedTotal,
        actualCost: estimatedTotal,
      },
    ],
  });
}
