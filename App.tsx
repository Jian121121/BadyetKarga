import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import RootNavigator from './src/app/navigation/RootNavigator';
import { initDatabase } from './src/services/database/db';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initDatabase();
    initializeAuth();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator />;
}