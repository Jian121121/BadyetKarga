import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../../../store/authStore';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>{currentUser?.fullName}</Text>
      <Text>{currentUser?.email}</Text>
      <Button title="Logout" onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 20 },
});