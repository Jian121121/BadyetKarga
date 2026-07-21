import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';

import AuthStack from './AuthStack';
import SetupWizardStack from './SetupWizardStack';
import MainTabNavigator from './MainTabNavigator';

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}