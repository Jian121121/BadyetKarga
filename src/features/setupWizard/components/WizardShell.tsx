import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import BrandLogo from '../../../shared/components/BrandLogo';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../../shared/theme';

const TOTAL_STEPS = 9;

interface WizardShellProps {
  /** 1-based step number (1..9) */
  step: number;
  onBack?: () => void;
  onSkip?: () => void;
  children: ReactNode;
}

export default function WizardShell({ step, onBack, onSkip, children }: WizardShellProps) {
  const insets = useSafeAreaInsets();
  const percent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {onBack && (
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
            </Pressable>
          )}
        </View>
        <BrandLogo size={28} style={styles.brand} />
        <View style={[styles.headerSide, styles.headerRight]}>
          {onSkip && (
            <Pressable onPress={onSkip} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.progressMeta}>
        <Text style={styles.stepLabel}>STEP {step} OF {TOTAL_STEPS}</Text>
        <Text style={styles.percentLabel}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 52,
  },
  headerSide: {
    width: 56,
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
  },
  skip: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  percentLabel: {
    ...typography.labelLg,
    color: colors.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerHighest,
    marginHorizontal: spacing.marginMobile,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.default,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    marginTop: spacing.sm,
  },
});
