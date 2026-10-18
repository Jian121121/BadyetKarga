import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import BrandLogo from '../../../shared/components/BrandLogo';

type Props = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <BrandLogo variant="full" size={170} style={styles.logo} />
          <Text style={styles.tagline}>Smart household budgeting for Filipino families</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.heading}>What it is</Text>
          <Text style={styles.body}>
            BadyetKarga helps households plan weekly Filipino meals within a grocery budget,
            generate shopping lists that respect pantry stock and allergies, and track spending
            through completed shopping trips.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>How your data is used</Text>
          <Text style={styles.body}>
            Family profiles, availability, pantry items, meal plans, and grocery lists stay on
            this device (SQLite). Sign-in sessions use Secure Storage when Remember Me is on.
            Google sign-in only uses your name and email to create or link your account.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>About this release</Text>
          <Text style={styles.body}>
            BadyetKarga helps households plan meals, shop smarter, and stay within budget. Grocery
            prices and savings figures are planning estimates, not financial advice.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  headerTitle: { ...typography.titleMd, color: colors.onSurface, flex: 1, textAlign: 'center' },
  content: { padding: spacing.marginMobile, gap: spacing.sm },
  hero: { alignItems: 'center', marginBottom: spacing.md, gap: 4 },
  logo: { marginBottom: spacing.sm },
  tagline: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  version: { ...typography.labelLg, color: colors.onSurfaceVariant, marginTop: 4 },
  card: { marginBottom: spacing.xs },
  heading: { ...typography.titleMd, color: colors.onSurface, marginBottom: 6 },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
