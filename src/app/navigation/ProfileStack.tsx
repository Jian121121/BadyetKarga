import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';

import ProfileScreen from '../../features/profile/screens/ProfileScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}