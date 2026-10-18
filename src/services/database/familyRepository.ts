import { Platform } from 'react-native';
import { db } from './db';

export interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  allergies: string;
  dietaryRestrictions: string;
  relationship: string;
  age: string;
  gender: string;
  favoriteFoods: string;
  avatarUri?: string | null;
  createdAt: string;
}

export interface FamilyMemberExtras {
  relationship?: string;
  age?: string;
  gender?: string;
  favoriteFoods?: string;
  avatarUri?: string | null;
}

const WEB_FAMILY_KEY = 'badyetkarga_web_family';

function loadWebFamily(): FamilyMember[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_FAMILY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FamilyMember[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebFamily(family: FamilyMember[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_FAMILY_KEY, JSON.stringify(family));
}

const mockFamily: FamilyMember[] = Platform.OS === 'web' ? loadWebFamily() : [];
let mockNextId = mockFamily.reduce((max, m) => Math.max(max, m.id), 0) + 1;

export async function addFamilyMember(
  userId: number,
  name: string,
  allergies: string,
  dietaryRestrictions: string,
  extras: FamilyMemberExtras = {}
): Promise<FamilyMember> {
  const createdAt = new Date().toISOString();
  const relationship = extras.relationship ?? '';
  const age = extras.age ?? '';
  const gender = extras.gender ?? '';
  const favoriteFoods = extras.favoriteFoods ?? '';
  const avatarUri = extras.avatarUri ?? null;

  if (Platform.OS === 'web') {
    const member: FamilyMember = {
      id: mockNextId++,
      userId,
      name,
      allergies,
      dietaryRestrictions,
      relationship,
      age,
      gender,
      favoriteFoods,
      avatarUri,
      createdAt,
    };
    mockFamily.push(member);
    saveWebFamily(mockFamily);
    return member;
  }

  const result = db!.runSync(
    `INSERT INTO family_members (userId, name, allergies, dietaryRestrictions, relationship, age, gender, favoriteFoods, avatarUri, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      userId,
      name,
      allergies,
      dietaryRestrictions,
      relationship,
      age,
      gender,
      favoriteFoods,
      avatarUri,
      createdAt,
    ]
  );
  return {
    id: result.lastInsertRowId,
    userId,
    name,
    allergies,
    dietaryRestrictions,
    relationship,
    age,
    gender,
    favoriteFoods,
    avatarUri,
    createdAt,
  };
}

export async function getFamilyMembers(userId: number): Promise<FamilyMember[]> {
  if (Platform.OS === 'web') {
    return mockFamily.filter((m) => m.userId === userId);
  }
  return db!.getAllSync<FamilyMember>(`SELECT * FROM family_members WHERE userId = ?;`, [userId]);
}

export async function deleteFamilyMember(userId: number, id: number): Promise<void> {
  if (Platform.OS === 'web') {
    const idx = mockFamily.findIndex((m) => m.userId === userId && m.id === id);
    if (idx !== -1) mockFamily.splice(idx, 1);
    saveWebFamily(mockFamily);
    return;
  }
  // Cascade only for a member owned by this user.
  db!.runSync(
    `DELETE FROM weekly_availability
     WHERE familyMemberId = (SELECT id FROM family_members WHERE userId = ? AND id = ?);`,
    [userId, id]
  );
  db!.runSync(`DELETE FROM family_members WHERE userId = ? AND id = ?;`, [userId, id]);
}

export async function updateFamilyMember(
  userId: number,
  id: number,
  patch: {
    name?: string;
    allergies?: string;
    dietaryRestrictions?: string;
    relationship?: string;
    age?: string;
    gender?: string;
    favoriteFoods?: string;
    avatarUri?: string | null;
  }
): Promise<void> {
  if (Platform.OS === 'web') {
    const member = mockFamily.find((m) => m.userId === userId && m.id === id);
    if (!member) return;
    Object.assign(member, patch);
    saveWebFamily(mockFamily);
    return;
  }
  const current = db!.getFirstSync<FamilyMember>(
    `SELECT * FROM family_members WHERE userId = ? AND id = ?;`,
    [userId, id]
  );
  if (!current) return;
  db!.runSync(
    `UPDATE family_members
     SET name = ?, allergies = ?, dietaryRestrictions = ?, relationship = ?, age = ?, gender = ?, favoriteFoods = ?, avatarUri = ?
    WHERE userId = ? AND id = ?;`,
    [
      patch.name ?? current.name,
      patch.allergies ?? current.allergies,
      patch.dietaryRestrictions ?? current.dietaryRestrictions,
      patch.relationship ?? current.relationship,
      patch.age ?? current.age,
      patch.gender ?? current.gender,
      patch.favoriteFoods ?? current.favoriteFoods,
      patch.avatarUri !== undefined ? patch.avatarUri : current.avatarUri ?? null,
      userId,
      id,
    ]
  );
}
