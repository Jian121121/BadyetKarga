import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'currentUserId';

export async function saveSession(userId: number): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, String(userId));
}

export async function getSession(): Promise<number | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  return value ? Number(value) : null;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}