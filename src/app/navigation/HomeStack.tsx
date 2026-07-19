import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';

import HomeDashboardScreen from '../../features/homeDashboard/screens/HomeDashboardScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="HomeDashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
    </Stack.Navigator>
  );
}