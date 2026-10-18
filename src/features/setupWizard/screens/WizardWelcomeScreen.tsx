import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Welcome'>;

export default function WizardWelcomeScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const firstName = currentUser?.fullName?.split(' ')[0] ?? 'there';

  return (
    <WizardShell step={1}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroStage}>
          <Image
            source={require('../../../../assets/wizard/wizard-welcome.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.smartBadge}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.onPrimary} />
            <Text style={styles.smartBadgeText}>Smart Setup</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome to BadyetKarga</Text>
        <Text style={styles.greeting}>Hi {firstName}!</Text>
        <Text style={styles.body}>
          Let's personalize your experience to help your family save time and money.
        </Text>

        <View style={styles.featureRow}>
          <View style={styles.featureCard}>
            <MaterialIcons name="restaurant" size={28} color={colors.primary} />
            <Text style={styles.featureLabel}>Meal Planning</Text>
          </View>
          <View style={styles.featureCard}>
            <MaterialIcons name="menu-book" size={28} color="#8B6914" />
            <Text style={styles.featureLabel}>Budget Tracking</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Get Started →" onPress={() => navigation.navigate('Household')} />
      </View>
    </WizardShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroStage: {
    height: 220,
    borderRadius: radii.xl * 2,
    backgroundColor: colors.primaryContainer,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  smartBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  smartBadgeText: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onPrimary,
  },
  title: {
    ...typography.headlineLgMobile,
    fontSize: 26,
    lineHeight: 34,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  featureLabel: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurface,
  },
  footer: {
    padding: spacing.marginMobile,
  },
});
