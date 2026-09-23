import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'currentUserId';
const REMEMBER_KEY = 'rememberMe';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

/** In-memory session used when Remember Me is off (dies when the app is killed). */
let memorySession: string | null = null;
let webPersistentSession: string | null = null;

function webLoad(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(`badyetkarga_${key}`);
  } catch {
    return null;
  }
}

function webSave(key: string, value: string | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (value === null) localStorage.removeItem(`badyetkarga_${key}`);
    else localStorage.setItem(`badyetkarga_${key}`, value);
  } catch {
    // ignore
  }
}

export async function setRememberMePreference(remember: boolean): Promise<void> {
  const value = remember ? '1' : '0';
  if (Platform.OS === 'web') {
    webSave(REMEMBER_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(REMEMBER_KEY, value);
}

export async function getRememberMePreference(): Promise<boolean> {
  // Only treat as remembered when explicitly opted in ('1').
  if (Platform.OS === 'web') {
    return webLoad(REMEMBER_KEY) === '1';
  }
  const v = await SecureStore.getItemAsync(REMEMBER_KEY);
  return v === '1';
}

export async function setRememberedEmail(email: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    webSave(REMEMBERED_EMAIL_KEY, email);
    return;
  }
  if (email) await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
  else await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
}

export async function getRememberedEmail(): Promise<string | null> {
  if (Platform.OS === 'web') return webLoad(REMEMBERED_EMAIL_KEY);
  return SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
}

/**
 * Persist the signed-in user.
 * - remember=true → SecureStore / localStorage (survives app restart) — returning users
 * - remember=false → memory only (new session each launch)
 */
export async function saveSession(userId: number, remember = true): Promise<void> {
  const value = String(userId);
  memorySession = value;
  await setRememberMePreference(remember);

  if (!remember) {
    // Clear any durable session so a kill doesn't auto-login
    if (Platform.OS === 'web') {
      webPersistentSession = null;
      webSave(SESSION_KEY, null);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    return;
  }

  if (Platform.OS === 'web') {
    webPersistentSession = value;
    webSave(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function getSession(): Promise<number | null> {
  if (memorySession) return Number(memorySession);

  if (Platform.OS === 'web') {
    const persisted = webPersistentSession ?? webLoad(SESSION_KEY);
    if (persisted) {
      webPersistentSession = persisted;
      memorySession = persisted;
      return Number(persisted);
    }
    return null;
  }

  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (value) {
    memorySession = value;
    return Number(value);
  }
  return null;
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  if (Platform.OS === 'web') {
    webPersistentSession = null;
    webSave(SESSION_KEY, null);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
