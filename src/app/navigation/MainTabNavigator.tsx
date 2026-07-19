import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';

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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0d631b', // primary color from your Stitch theme
        tabBarInactiveTintColor: '#40493d', // on-surface-variant from your Stitch theme
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerStack}
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-month" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="GroceriesTab"
        component={GroceriesStack}
        options={{
          title: 'Groceries',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStack}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="query-stats" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}