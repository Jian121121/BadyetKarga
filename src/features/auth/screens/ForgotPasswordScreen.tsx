import { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import BrandLogo from '../../../shared/components/BrandLogo';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { useAuthStore } from '../../../store/authStore';
import { normalizeGmail } from '../../../services/auth/firebaseAuthService';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { isLoading, error, clearError, sendPasswordReset } = useAuthStore();

  const handleReset = async () => {
    clearError();
    setLocalError(null);
    if (isLoading) return;

    let gmail: string;
    try {
      gmail = normalizeGmail(email);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Use the Gmail you registered with.');
      return;
    }

    confirmAction(
      'Send password reset link?',
      `We will send a reset link to ${gmail}. Is this email correct?`,
      'Send link',
      () => {
        void (async () => {
          const sent = await sendPasswordReset(gmail);
          if (!sent) {
            setLocalError(useAuthStore.getState().error || 'Could not send the reset email.');
            return;
          }

          notify(
            'Check your email',
            `BadyetKarga sent a password reset link to ${gmail}. Open it to choose a new password, then log in.`,
            () => navigation.navigate('Login')
          );
        })();
      }
    );
  };

  const displayError = localError || error;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.blobGreen} />
      <View style={styles.blobGold} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <BrandLogo style={styles.brandRow} />

        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="lock-reset" size={32} color={colors.onPrimary} />
          </View>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter the Gmail you registered with. BadyetKarga will send a reset link — open it to set
            a new password.
          </Text>

          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[styles.inputWrap, focused && styles.inputFocused]}>
            <MaterialIcons name="mail-outline" size={20} color={colors.onSurfaceVariant} />
            <RNTextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="Enter your Gmail"
              placeholderTextColor={colors.outline}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={styles.input}
            />
          </View>

          {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

          <Pressable
            style={[styles.primaryButton, isLoading && styles.disabled]}
            onPress={() => void handleReset()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.primaryLabel}>Send Reset Link</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
              </>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginRow}>
            <Text style={styles.loginText}>
              Remembered it? <Text style={styles.loginLink}>Back to Login</Text>
            </Text>
          </Pressable>
        </Card>

        <Text style={styles.footer}>© 2026 BadyetKarga. Smart Household Utility.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.md,
  },
  blobGreen: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    left: -70,
    backgroundColor: colors.primaryContainer,
    opacity: 0.18,
  },
  blobGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 80,
    right: -50,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.2,
  },
  brandRow: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  card: { gap: spacing.sm },
  iconCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, textAlign: 'center' },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface, paddingVertical: 0 },
  primaryButton: {
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  disabled: { opacity: 0.55 },
  primaryLabel: { ...typography.titleMd, color: colors.onPrimary },
  loginRow: { marginTop: spacing.sm, alignItems: 'center' },
  loginText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  loginLink: { color: colors.primary, fontWeight: '700' },
  footer: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.labelLg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});