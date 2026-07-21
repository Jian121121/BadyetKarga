import { Platform } from 'react-native';
import { db } from './db';

export interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  allergies: string;
  dietaryRestrictions: string;
  createdAt: string;
}

const mockFamily: FamilyMember[] = [];
let mockNextId = 1;

export async function addFamilyMember(
  userId: number,
  name: string,
  allergies: string,
  dietaryRestrictions: string
): Promise<FamilyMember> {
  const createdAt = new Date().toISOString();

  if (Platform.OS === 'web') {
    const member: FamilyMember = { id: mockNextId++, userId, name, allergies, dietaryRestrictions, createdAt };
    mockFamily.push(member);
    return member;
  }

  const result = db!.runSync(
    `INSERT INTO family_members (userId, name, allergies, dietaryRestrictions, createdAt) VALUES (?, ?, ?, ?, ?);`,
    [userId, name, allergies, dietaryRestrictions, createdAt]
  );
  return { id: result.lastInsertRowId, userId, name, allergies, dietaryRestrictions, createdAt };
}

export async function getFamilyMembers(userId: number): Promise<FamilyMember[]> {
  if (Platform.OS === 'web') {
    return mockFamily.filter((m) => m.userId === userId);
  }
  return db!.getAllSync<FamilyMember>(`SELECT * FROM family_members WHERE userId = ?;`, [userId]);
}

export async function deleteFamilyMember(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockFamily.findIndex((m) => m.id === id);
    if (idx !== -1) mockFamily.splice(idx, 1);
    return;
  }
  db!.runSync(`DELETE FROM family_members WHERE id = ?;`, [id]);
}