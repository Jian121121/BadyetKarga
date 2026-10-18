import { Platform } from 'react-native';
import { db } from './db';

const WEB_META_KEY = 'badyetkarga_web_app_meta';

type MetaMap = Record<string, string>; // `${userId}::${key}` → value

function loadWebMeta(): MetaMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEB_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MetaMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveWebMeta(map: MetaMap) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_META_KEY, JSON.stringify(map));
}

const webMeta: MetaMap = Platform.OS === 'web' ? loadWebMeta() : {};

function webKey(userId: number, key: string) {
  return `${userId}::${key}`;
}

export async function getAppMeta(userId: number, key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMeta[webKey(userId, key)] ?? null;
  }
  const row = db!.getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE userId = ? AND key = ?;`,
    [userId, key]
  );
  return row?.value ?? null;
}

export async function setAppMeta(userId: number, key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMeta[webKey(userId, key)] = value;
    saveWebMeta(webMeta);
    return;
  }
  db!.runSync(
    `INSERT OR REPLACE INTO app_meta (userId, key, value) VALUES (?, ?, ?);`,
    [userId, key, value]
  );
}

export async function deleteAppMeta(userId: number, key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete webMeta[webKey(userId, key)];
    saveWebMeta(webMeta);
    return;
  }
  db!.runSync(`DELETE FROM app_meta WHERE userId = ? AND key = ?;`, [userId, key]);
}

export async function clearAppMeta(userId: number): Promise<void> {
  if (Platform.OS === 'web') {
    const prefix = `${userId}::`;
    for (const key of Object.keys(webMeta)) {
      if (key.startsWith(prefix)) delete webMeta[key];
    }
    saveWebMeta(webMeta);
    return;
  }
  db!.runSync(`DELETE FROM app_meta WHERE userId = ?;`, [userId]);
}

/** Well-known meta keys */
export const META_KEYS = {
  pendingNewWeekPrompt: 'pendingNewWeekPrompt',
  lastResetWeek: 'lastResetWeek',
  notificationsEnabled: 'notificationsEnabled',
  notifMeals: 'notifMeals',
  notifGroceries: 'notifGroceries',
  notifBudget: 'notifBudget',
  notifReadIds: 'notifReadIds',
  priceMemory: 'priceMemory',
} as const;
