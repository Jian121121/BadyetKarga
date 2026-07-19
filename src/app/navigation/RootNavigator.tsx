import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import AuthStack from './AuthStack';
import SetupWizardStack from './SetupWizardStack';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthStack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthStack" component={AuthStack} />
        <Stack.Screen name="SetupWizardStack" component={SetupWizardStack} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}