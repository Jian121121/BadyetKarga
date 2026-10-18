import type { Availability } from '../../services/database/availabilityRepository';
import { WEEK_DAYS, WEEK_MEALS, type WeekDay, type WeekMeal } from './week';

export interface NamedMember {
  id: number;
  name: string;
  avatarUri?: string | null;
}

export interface EaterInfo {
  id: number;
  name: string;
  avatarUri?: string | null;
}

/** Eaters available for a specific day + meal slot. */
export function eatersForSlot(
  rows: Availability[],
  members: NamedMember[],
  dayOfWeek: string,
  mealType: string
): EaterInfo[] {
  const meal = mealType.toLowerCase() as WeekMeal;
  if (!WEEK_MEALS.includes(meal)) return [];
  const byId = new Map(members.map((m) => [m.id, m]));
  const out: EaterInfo[] = [];
  for (const row of rows) {
    if (row.dayOfWeek !== dayOfWeek) continue;
    if (!row[meal]) continue;
    const member = byId.get(row.familyMemberId);
    if (member) {
      out.push({ id: member.id, name: member.name, avatarUri: member.avatarUri });
    }
  }
  return out;
}

/**
 * Build a map of `${day}|${meal}` → eaters (name + photo).
 * When no availability rows exist, assume every member eats every slot.
 */
export function buildEatersBySlot(
  rows: Availability[],
  members: NamedMember[]
): Map<string, EaterInfo[]> {
  const map = new Map<string, EaterInfo[]>();
  const hasRows = rows.length > 0;
  const fallback: EaterInfo[] =
    members.length > 0
      ? members.map((m) => ({ id: m.id, name: m.name, avatarUri: m.avatarUri }))
      : [{ id: 0, name: 'Household', avatarUri: null }];

  for (const day of WEEK_DAYS) {
    for (const meal of WEEK_MEALS) {
      const key = `${day}|${meal}`;
      if (!hasRows) {
        map.set(key, [...fallback]);
      } else {
        map.set(key, eatersForSlot(rows, members, day, meal));
      }
    }
  }
  return map;
}

export function eatersCountFromMap(eatersBySlot: Map<string, EaterInfo[]>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [key, eaters] of eatersBySlot) {
    counts.set(key, eaters.length);
  }
  return counts;
}

/** Compact label: "Ana", "Ana, Ben", "Ana, Ben +2" */
export function formatEaterNames(names: string[], maxShow = 2): string {
  if (names.length === 0) return '';
  if (names.length <= maxShow) return names.join(', ');
  const shown = names.slice(0, maxShow).join(', ');
  return `${shown} +${names.length - maxShow}`;
}

export function formatEaters(eaters: EaterInfo[], maxShow = 2): string {
  return formatEaterNames(
    eaters.map((e) => e.name),
    maxShow
  );
}

export function slotKey(day: string, meal: string): string {
  return `${day}|${meal}`;
}

export type { WeekDay, WeekMeal };
