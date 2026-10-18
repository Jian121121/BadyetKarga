import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/authStore';
import { useHouseholdStore } from '../../store/householdStore';

import AuthStack from './AuthStack';
import SetupWizardStack from './SetupWizardStack';
import MainTabNavigator from './MainTabNavigator';

const navigationRef = createNavigationContainerRef<any>();

/** expo-notifications' last-response API is native-only and throws on web. */
const useLastNotificationResponse: typeof Notifications.useLastNotificationResponse =
  Platform.OS === 'web' ? () => null : Notifications.useLastNotificationResponse;

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const settings = useHouseholdStore((state) => state.settings);
  const loadSettings = useHouseholdStore((state) => state.loadSettings);

  const lastResponse = useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);
  const [navReady, setNavReady] = useState(false);
  const inMainTabs = isAuthenticated && !!settings;

  useEffect(() => {
    if (!lastResponse || !navReady || !inMainTabs || !navigationRef.isReady()) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponseId.current === id) return;
    handledResponseId.current = id;
    if (lastResponse.notification.request.content.data?.route === 'shopping-mode') {
      navigationRef.navigate('GroceriesTab', { screen: 'ShoppingMode', initial: false });
    }
  }, [lastResponse, navReady, inMainTabs]);

  useEffect(() => {
    // After login, settings is cleared to undefined — fetch once to decide Wizard vs Home.
    if (isAuthenticated && currentUser && settings === undefined) {
      void loadSettings(currentUser.id);
    }
  }, [isAuthenticated, currentUser?.id, settings, loadSettings]);

  if (!isAuthenticated) {
    return (
      <NavigationContainer ref={navigationRef}>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // Waiting for household settings lookup after login
  if (settings === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      key={settings === null ? 'wizard' : 'main'}
      ref={navigationRef}
      onReady={() => setNavReady(true)}
    >
      {settings === null ? <SetupWizardStack /> : <MainTabNavigator />}
    </NavigationContainer>
  );
}
