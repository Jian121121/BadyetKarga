import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'hasSeenOnboarding';
const WEB_KEY = 'badyetkarga_hasSeenOnboarding';

export async function hasSeenOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(WEB_KEY) === '1';
  }
  const value = await SecureStore.getItemAsync(KEY);
  return value === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(WEB_KEY, '1');
    return;
  }
  await SecureStore.setItemAsync(KEY, '1');
}
