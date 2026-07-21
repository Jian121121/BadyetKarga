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

const mockAvailability: Availability[] = [];
let mockNextId = 1;

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
    const record: Availability = { id: existingIdx !== -1 ? mockAvailability[existingIdx].id : mockNextId++, familyMemberId, dayOfWeek, breakfast, lunch, snack, dinner };
    if (existingIdx !== -1) mockAvailability[existingIdx] = record;
    else mockAvailability.push(record);
    return;
  }

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