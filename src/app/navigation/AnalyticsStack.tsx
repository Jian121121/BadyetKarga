import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AnalyticsStackParamList } from './types';

import AnalyticsDashboardScreen from '../../features/analytics/screens/AnalyticsDashboardScreen';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export default function AnalyticsStack() {
  return (
    <Stack.Navigator initialRouteName="AnalyticsDashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
    </Stack.Navigator>
  );
}