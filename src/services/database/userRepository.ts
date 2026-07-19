import { Platform } from 'react-native';
import { db } from './db';
import { hashPassword, verifyPassword } from '../../shared/utils/hashPassword';

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

// ── Web fallback: in-memory mock, only lives as long as the browser tab ──
interface MockUserRecord extends User {
  passwordHash: string;
}
const mockUsers: MockUserRecord[] = [];
let mockNextId = 1;

export async function registerUser(
  fullName: string,
  email: string,
  plainTextPassword: string
): Promise<User> {
  const passwordHash = await hashPassword(plainTextPassword);
  const createdAt = new Date().toISOString();

  if (Platform.OS === 'web') {
    const existing = mockUsers.find((u) => u.email === email);
    if (existing) throw new Error('An account with this email already exists.');

    const newUser: MockUserRecord = { id: mockNextId++, fullName, email, passwordHash, createdAt };
    mockUsers.push(newUser);
    return { id: newUser.id, fullName, email, createdAt };
  }

  try {
    const result = db!.runSync(
      `INSERT INTO users (fullName, email, passwordHash, createdAt) VALUES (?, ?, ?, ?);`,
      [fullName, email, passwordHash, createdAt]
    );
    return { id: result.lastInsertRowId, fullName, email, createdAt };
  } catch (error) {
    throw new Error('An account with this email already exists.');
  }
}

export async function loginUser(
  email: string,
  plainTextPassword: string
): Promise<User | null> {
  if (Platform.OS === 'web') {
    const found = mockUsers.find((u) => u.email === email);
    if (!found) return null;
    const isValid = await verifyPassword(plainTextPassword, found.passwordHash);
    if (!isValid) return null;
    return { id: found.id, fullName: found.fullName, email: found.email, createdAt: found.createdAt };
  }

  const row = db!.getFirstSync<{
    id: number;
    fullName: string;
    email: string;
    passwordHash: string;
    createdAt: string;
  }>(`SELECT * FROM users WHERE email = ?;`, [email]);

  if (!row) return null;

  const isValid = await verifyPassword(plainTextPassword, row.passwordHash);
  if (!isValid) return null;

  return { id: row.id, fullName: row.fullName, email: row.email, createdAt: row.createdAt };
}

export async function getUserById(id: number): Promise<User | null> {
  if (Platform.OS === 'web') {
    const found = mockUsers.find((u) => u.id === id);
    if (!found) return null;
    return { id: found.id, fullName: found.fullName, email: found.email, createdAt: found.createdAt };
  }

  const row = db!.getFirstSync<{
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
  }>(`SELECT id, fullName, email, createdAt FROM users WHERE id = ?;`, [id]);

  return row ?? null;
}