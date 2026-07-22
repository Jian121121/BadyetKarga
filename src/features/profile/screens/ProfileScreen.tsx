import { View, Text, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { currentUser, logout } = useAuthStore();

  const confirmLogout = () => {
    Alert.alert('Log out?', "Are you sure you want to logout? You'll need to sign back in to access your household planners and groceries.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <Card style={styles.userCard}>
        <Text style={styles.name}>{currentUser?.fullName}</Text>
        <Text style={styles.email}>{currentUser?.email}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Household Management</Text>
      <Card style={styles.settingsCard}>
        <Button label="Family Members" variant="text" onPress={() => navigation.navigate('FamilyManagement')} />
        <Button label="Weekly Availability" variant="text" onPress={() => navigation.navigate('WeeklyAvailability')} />
        <Button label="Pantry" variant="text" onPress={() => navigation.navigate('Pantry')} />
      </Card>

      <Button label="Logout" variant="outlined" onPress={confirmLogout} style={styles.logoutButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  userCard: { alignItems: 'center', marginBottom: spacing.md },
  name: { ...typography.titleLg, color: colors.onSurface },
  email: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  sectionTitle: { ...typography.titleMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  settingsCard: { marginBottom: spacing.xl, gap: spacing.xs },
  logoutButton: { borderColor: colors.error },
});