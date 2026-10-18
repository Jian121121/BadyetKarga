import { Platform } from 'react-native';
import { db } from './db';

export interface Availability {
  id: number;
  familyMemberId: number;
  dayOfWeek: string;
  breakfast: boolean;
  lunch: boolean;
  snack: boolean;
  dinner: boolean;
}

const WEB_AVAILABILITY_KEY = 'badyetkarga_web_availability';

function loadWebAvailability(): Availability[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_AVAILABILITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Availability[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebAvailability(rows: Availability[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_AVAILABILITY_KEY, JSON.stringify(rows));
}

const mockAvailability: Availability[] = Platform.OS === 'web' ? loadWebAvailability() : [];
let mockNextId = mockAvailability.reduce((max, a) => Math.max(max, a.id), 0) + 1;

export async function setAvailability(
  familyMemberId: number,
  dayOfWeek: string,
  breakfast: boolean,
  lunch: boolean,
  snack: boolean,
  dinner: boolean
): Promise<void> {
  if (Platform.OS === 'web') {
    const existingIdx = mockAvailability.findIndex(
      (a) => a.familyMemberId === familyMemberId && a.dayOfWeek === dayOfWeek
    );
    const record: Availability = {
      id: existingIdx !== -1 ? mockAvailability[existingIdx].id : mockNextId++,
      familyMemberId,
      dayOfWeek,
      breakfast,
      lunch,
      snack,
      dinner,
    };
    if (existingIdx !== -1) mockAvailability[existingIdx] = record;
    else mockAvailability.push(record);
    saveWebAvailability(mockAvailability);
    return;
  }

  db!.runSync(
    `DELETE FROM weekly_availability WHERE familyMemberId = ? AND dayOfWeek = ?;`,
    [familyMemberId, dayOfWeek]
  );
  db!.runSync(
    `INSERT INTO weekly_availability (familyMemberId, dayOfWeek, breakfast, lunch, snack, dinner)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [familyMemberId, dayOfWeek, breakfast ? 1 : 0, lunch ? 1 : 0, snack ? 1 : 0, dinner ? 1 : 0]
  );
}

export async function getAvailabilityForMember(familyMemberId: number): Promise<Availability[]> {
  if (Platform.OS === 'web') {
    return mockAvailability.filter((a) => a.familyMemberId === familyMemberId);
  }
  const rows = db!.getAllSync<any>(
    `SELECT * FROM weekly_availability WHERE familyMemberId = ?;`,
    [familyMemberId]
  );
  return rows.map((r) => ({
    ...r,
    breakfast: !!r.breakfast,
    lunch: !!r.lunch,
    snack: !!r.snack,
    dinner: !!r.dinner,
  }));
}

/** All availability rows for a set of family members. */
export async function getAvailabilityForMembers(memberIds: number[]): Promise<Availability[]> {
  if (memberIds.length === 0) return [];
  if (Platform.OS === 'web') {
    return mockAvailability.filter((a) => memberIds.includes(a.familyMemberId));
  }
  const placeholders = memberIds.map(() => '?').join(',');
  const rows = db!.getAllSync<any>(
    `SELECT * FROM weekly_availability WHERE familyMemberId IN (${placeholders});`,
    memberIds
  );
  return rows.map((r) => ({
    ...r,
    breakfast: !!r.breakfast,
    lunch: !!r.lunch,
    snack: !!r.snack,
    dinner: !!r.dinner,
  }));
}
