import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import CustomTabBar from './CustomTabBar';

import HomeStack from './HomeStack';
import PlannerStack from './PlannerStack';
import GroceriesStack from './GroceriesStack';
import AnalyticsStack from './AnalyticsStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="PlannerTab" component={PlannerStack} options={{ title: 'Planner' }} />
      <Tab.Screen name="GroceriesTab" component={GroceriesStack} options={{ title: 'Groceries' }} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsStack} options={{ title: 'Analytics' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
