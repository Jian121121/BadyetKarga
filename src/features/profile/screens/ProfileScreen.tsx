import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../../store/authStore';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuthStore();

  const confirmLogout = () => {
    Alert.alert('Log out?', "Are you sure you want to logout? You'll need to sign back in to access your household planners and groceries.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.userCard}>
        <Text style={styles.name}>{currentUser?.fullName}</Text>
        <Text style={styles.email}>{currentUser?.email}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <Card style={styles.settingsCard}>
        {['Theme', 'Notifications', 'Language', 'Privacy'].map((label) => (
          <Pressable key={label} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>

      <Button label="Logout" variant="outlined" onPress={confirmLogout} style={styles.logoutButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.md },
  userCard: { alignItems: 'center', marginBottom: spacing.md },
  name: { ...typography.titleLg, color: colors.onSurface },
  email: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  sectionTitle: { ...typography.titleMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  settingsCard: { marginBottom: spacing.xl },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  settingLabel: { ...typography.bodyLg, color: colors.onSurface },
  chevron: { fontSize: 20, color: colors.outline },
  logoutButton: { borderColor: colors.error },
});