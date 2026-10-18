import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/app/navigation/RootNavigator';
import AppDialog from './src/shared/components/AppDialog';
import { initDatabase } from './src/services/database/db';
import { seedDishes } from './src/services/database/seedData';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/shared/theme';

export default function App() {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    initDatabase();
    seedDishes();
    initializeAuth();
  }, []);

  if (!fontsLoaded || isInitializing) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <AppDialog />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
