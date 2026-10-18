import { Platform } from 'react-native';
import { db } from './db';
import { hashPassword, verifyPassword } from '../../shared/utils/hashPassword';

export type AuthProvider = 'email' | 'google';

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
  avatarUri?: string | null;
  authProvider?: AuthProvider;
  googleId?: string | null;
  emailVerified?: boolean;
}

interface MockUserRecord extends User {
  passwordHash: string;
}

const WEB_USERS_KEY = 'badyetkarga_web_users';

function loadWebUsers(): MockUserRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWebUsers(users: MockUserRecord[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_USERS_KEY, JSON.stringify(users));
}

const mockUsers: MockUserRecord[] = Platform.OS === 'web' ? loadWebUsers() : [];
let mockNextId =
  Platform.OS === 'web'
    ? mockUsers.reduce((max, user) => Math.max(max, user.id), 0) + 1
    : 1;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function toPublicUser(row: {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
  avatarUri?: string | null;
  authProvider?: string | null;
  googleId?: string | null;
  emailVerified?: number | boolean | null;
}): User {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    createdAt: row.createdAt,
    avatarUri: row.avatarUri ?? null,
    authProvider: (row.authProvider as AuthProvider) || 'email',
    googleId: row.googleId ?? null,
    emailVerified: !!row.emailVerified,
  };
}

function findMockUser(email: string): MockUserRecord | undefined {
  const normalized = normalizeEmail(email);
  return mockUsers.find((u) => u.email === normalized);
}

function findNativeUserByEmail(email: string) {
  if (!db) return null;
  const normalized = normalizeEmail(email);
  return (
    db.getFirstSync<{
      id: number;
      fullName: string;
      email: string;
      passwordHash: string;
      createdAt: string;
      avatarUri: string | null;
      authProvider: string | null;
      googleId: string | null;
      emailVerified: number | null;
    }>(
      `SELECT id, fullName, email, passwordHash, createdAt, avatarUri, authProvider, googleId, emailVerified
       FROM users WHERE email = ? LIMIT 1;`,
      [normalized]
    ) ?? null
  );
}

/** Creates a verified email/password account (after OTP succeeds). */
export async function registerUser(
  fullName: string,
  email: string,
  plainTextPassword: string
): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = fullName.trim();

  if (!trimmedName || !normalizedEmail || !plainTextPassword) {
    throw new Error('Please fill in all fields.');
  }

  if (Platform.OS === 'web') {
    if (findMockUser(normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }
    const passwordHash = await hashPassword(plainTextPassword);
    const createdAt = new Date().toISOString();
    const newUser: MockUserRecord = {
      id: mockNextId++,
      fullName: trimmedName,
      email: normalizedEmail,
      passwordHash,
      createdAt,
      avatarUri: null,
      authProvider: 'email',
      googleId: null,
      emailVerified: true,
    };
    mockUsers.push(newUser);
    saveWebUsers(mockUsers);
    return toPublicUser(newUser);
  }

  if (!db) throw new Error('Database is not ready. Please restart the app.');

  const passwordHash = await hashPassword(plainTextPassword);
  const createdAt = new Date().toISOString();

  try {
    const result = db.runSync(
      `INSERT INTO users (fullName, email, passwordHash, createdAt, authProvider, emailVerified)
       VALUES (?, ?, ?, ?, 'email', 1);`,
      [trimmedName, normalizedEmail, passwordHash, createdAt]
    );
    return toPublicUser({
      id: Number(result.lastInsertRowId),
      fullName: trimmedName,
      email: normalizedEmail,
      createdAt,
      authProvider: 'email',
      emailVerified: 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      throw new Error('An account with this email already exists.');
    }
    throw new Error(`Registration failed: ${message}`);
  }
}

/**
 * Find-or-create a Google-authenticated user (standard OAuth link logic).
 * If an email account already exists, link Google to it.
 */
export async function upsertGoogleUser(input: {
  email: string;
  fullName: string;
  googleId: string;
}): Promise<User> {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim() || email.split('@')[0];
  const googleId = input.googleId;

  if (Platform.OS === 'web') {
    let found = findMockUser(email);
    if (found) {
      found.googleId = googleId;
      found.authProvider = found.authProvider === 'email' ? found.authProvider : 'google';
      found.emailVerified = true;
      if (!found.fullName) found.fullName = fullName;
      saveWebUsers(mockUsers);
      return toPublicUser(found);
    }
    const createdAt = new Date().toISOString();
    const passwordHash = await hashPassword(`google:${googleId}:${Date.now()}`);
    const newUser: MockUserRecord = {
      id: mockNextId++,
      fullName,
      email,
      passwordHash,
      createdAt,
      avatarUri: null,
      authProvider: 'google',
      googleId,
      emailVerified: true,
    };
    mockUsers.push(newUser);
    saveWebUsers(mockUsers);
    return toPublicUser(newUser);
  }

  if (!db) throw new Error('Database is not ready.');

  const byGoogle = db.getFirstSync<{
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
    avatarUri: string | null;
    authProvider: string | null;
    googleId: string | null;
    emailVerified: number | null;
  }>(
    `SELECT id, fullName, email, createdAt, avatarUri, authProvider, googleId, emailVerified
     FROM users WHERE googleId = ? LIMIT 1;`,
    [googleId]
  );
  if (byGoogle) return toPublicUser(byGoogle);

  const existing = findNativeUserByEmail(email);
  if (existing) {
    db.runSync(
      `UPDATE users SET googleId = ?, emailVerified = 1 WHERE id = ?;`,
      [googleId, existing.id]
    );
    return toPublicUser({ ...existing, googleId, emailVerified: 1 });
  }

  const createdAt = new Date().toISOString();
  const passwordHash = await hashPassword(`google:${googleId}:${Date.now()}`);
  const result = db.runSync(
    `INSERT INTO users (fullName, email, passwordHash, createdAt, authProvider, googleId, emailVerified)
     VALUES (?, ?, ?, ?, 'google', ?, 1);`,
    [fullName, email, passwordHash, createdAt, googleId]
  );
  return toPublicUser({
    id: Number(result.lastInsertRowId),
    fullName,
    email,
    createdAt,
    authProvider: 'google',
    googleId,
    emailVerified: 1,
  });
}

export async function loginUser(
  email: string,
  plainTextPassword: string
): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);

  if (Platform.OS === 'web') {
    const found = findMockUser(normalizedEmail);
    if (!found) return null;
    if (found.authProvider === 'google' && !found.passwordHash) return null;
    const isValid = await verifyPassword(plainTextPassword, found.passwordHash);
    if (!isValid) return null;
    return toPublicUser(found);
  }

  const row = findNativeUserByEmail(normalizedEmail);
  if (!row) return null;

  const isValid = await verifyPassword(plainTextPassword, row.passwordHash);
  if (!isValid) return null;

  return toPublicUser(row);
}

export async function getUserById(id: number): Promise<User | null> {
  if (Platform.OS === 'web') {
    const found = mockUsers.find((u) => u.id === id);
    return found ? toPublicUser(found) : null;
  }
  if (!db) return null;
  const row = db.getFirstSync<{
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
    avatarUri: string | null;
    authProvider: string | null;
    googleId: string | null;
    emailVerified: number | null;
  }>(
    `SELECT id, fullName, email, createdAt, avatarUri, authProvider, googleId, emailVerified
     FROM users WHERE id = ? LIMIT 1;`,
    [id]
  );
  return row ? toPublicUser(row) : null;
}

export async function updateUserAvatar(userId: number, avatarUri: string | null): Promise<User | null> {
  if (Platform.OS === 'web') {
    const found = mockUsers.find((u) => u.id === userId);
    if (!found) return null;
    found.avatarUri = avatarUri;
    saveWebUsers(mockUsers);
    return toPublicUser(found);
  }
  if (!db) return null;
  db.runSync(`UPDATE users SET avatarUri = ? WHERE id = ?;`, [avatarUri, userId]);
  return getUserById(userId);
}

export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  if (Platform.OS === 'web') {
    const found = mockUsers.find((u) => u.id === userId);
    if (!found) throw new Error('User not found.');
    if (found.authProvider === 'google') {
      // Allow setting a local password for Google accounts
      found.passwordHash = await hashPassword(newPassword);
      saveWebUsers(mockUsers);
      return;
    }
    const ok = await verifyPassword(currentPassword, found.passwordHash);
    if (!ok) throw new Error('Current password is incorrect.');
    found.passwordHash = await hashPassword(newPassword);
    saveWebUsers(mockUsers);
    return;
  }

  if (!db) throw new Error('Database is not ready.');
  const row = db.getFirstSync<{ passwordHash: string; authProvider: string | null }>(
    `SELECT passwordHash, authProvider FROM users WHERE id = ?;`,
    [userId]
  );
  if (!row) throw new Error('User not found.');

  if (row.authProvider !== 'google') {
    const ok = await verifyPassword(currentPassword, row.passwordHash);
    if (!ok) throw new Error('Current password is incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);
  db.runSync(`UPDATE users SET passwordHash = ? WHERE id = ?;`, [passwordHash, userId]);
}

/**
 * Ensures a local profile exists after Firebase auth succeeds.
 * Keeps a local password hash in sync so offline profile helpers still work.
 */
export async function upsertLocalEmailUser(
  fullName: string,
  email: string,
  plainTextPassword: string
): Promise<User> {
  const normalized = normalizeEmail(email);
  const trimmedName = fullName.trim() || normalized.split('@')[0] || 'User';
  const passwordHash = await hashPassword(plainTextPassword);

  if (Platform.OS === 'web') {
    const found = findMockUser(normalized);
    if (found) {
      found.fullName = trimmedName || found.fullName;
      found.passwordHash = passwordHash;
      found.emailVerified = true;
      found.authProvider = 'email';
      saveWebUsers(mockUsers);
      return toPublicUser(found);
    }
    return registerUser(trimmedName, normalized, plainTextPassword);
  }

  if (!db) throw new Error('Database is not ready.');
  const existing = findNativeUserByEmail(normalized);
  if (existing) {
    db.runSync(
      `UPDATE users SET fullName = ?, passwordHash = ?, emailVerified = 1, authProvider = 'email' WHERE id = ?;`,
      [trimmedName || existing.fullName, passwordHash, existing.id]
    );
    return toPublicUser({
      ...existing,
      fullName: trimmedName || existing.fullName,
      emailVerified: 1,
      authProvider: 'email',
    });
  }
  return registerUser(trimmedName, normalized, plainTextPassword);
}

/** Resets password for a registered email after OTP verification succeeds. */
export async function resetPasswordByEmail(
  email: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const normalized = normalizeEmail(email);

  if (Platform.OS === 'web') {
    const found = findMockUser(normalized);
    if (!found) throw new Error('No account found for that email.');
    found.passwordHash = await hashPassword(newPassword);
    found.emailVerified = true;
    saveWebUsers(mockUsers);
    return;
  }

  if (!db) throw new Error('Database is not ready.');
  const row = findNativeUserByEmail(normalized);
  if (!row) throw new Error('No account found for that email.');

  const passwordHash = await hashPassword(newPassword);
  db.runSync(`UPDATE users SET passwordHash = ?, emailVerified = 1 WHERE id = ?;`, [
    passwordHash,
    row.id,
  ]);
}
