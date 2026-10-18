/** Monday-anchored week helpers shared by Planner, Home, Groceries, and Analytics. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date as YYYY-MM-DD (no timezone shift). */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing `date` (Mon–Sun weeks). */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalISODate(d);
}

export function parseLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** e.g. "October 21 - October 27, 2024" */
export function getWeekDateRangeLabel(weekStart: string = getWeekStart()): string {
  const start = parseLocalISODate(weekStart);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startLabel = start.toLocaleDateString('en-US', opts);
  const endLabel = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

/** Days remaining in the week including today (Mon–Sun). */
export function daysLeftInWeek(weekStart: string = getWeekStart(), today: Date = new Date()): number {
  const end = parseLocalISODate(weekStart);
  end.setDate(end.getDate() + 6);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((end.getTime() - t.getTime()) / DAY_MS);
  return Math.max(0, diff) + 1;
}

/** Short day label + date, e.g. "MON 21" for Mon of the given week. */
export function dayLabelForWeek(weekStart: string, dayKey: string): string {
  const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const idx = ORDER.indexOf(dayKey);
  if (idx < 0) return dayKey.toUpperCase();
  const d = parseLocalISODate(weekStart);
  d.setDate(d.getDate() + idx);
  return `${dayKey.toUpperCase()} ${d.getDate()}`;
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

/** Calendar date of `dayKey` ("Mon"…"Sun") in the week starting `weekStart`. */
export function dateForWeekDay(weekStart: string, dayKey: string): Date {
  const d = parseLocalISODate(weekStart);
  d.setDate(d.getDate() + Math.max(0, WEEK_DAYS.indexOf(dayKey as WeekDay)));
  return d;
}

export function getPlanDays(durationDays = 7, cookFrequency?: string | null): string[] {
  let days = [...WEEK_DAYS];
  if (cookFrequency === 'Weekdays') days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  if (cookFrequency === 'Weekends') days = ['Sat', 'Sun'];
  if (cookFrequency === 'Occasionally') days = ['Mon', 'Wed', 'Sat'];
  return days.slice(0, Math.min(7, Math.max(1, durationDays)));
}

export const WEEK_MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type WeekMeal = (typeof WEEK_MEALS)[number];

export function listOpenMealSlots(
  entries: Array<{ dayOfWeek: string; mealType: string }>,
  eatersBySlot?: Map<string, { id?: number }[]>
): Array<{ day: string; meal: string }> {
  return WEEK_DAYS.flatMap((day) =>
    WEEK_MEALS.filter((meal) => {
      if (entries.some((entry) => entry.dayOfWeek === day && entry.mealType === meal)) return false;
      if (!eatersBySlot || eatersBySlot.size === 0) return true;
      return (eatersBySlot.get(`${day}|${meal}`)?.length ?? 0) > 0;
    }).map((meal) => ({ day, meal }))
  );
}

/** Milliseconds until next Monday 00:00 local (week boundary for live reset). */
export function msUntilNextWeekStart(from: Date = new Date()): number {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  // If already Monday, schedule next week's Monday; otherwise next Monday.
  const daysUntilMon = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysUntilMon);
  return Math.max(1000, next.getTime() - from.getTime());
}
