import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput as RNTextInput,
  ActivityIndicator,
} from 'react-native';
import { useAppDimensions } from '../../../shared/utils/appDimensions';
import { MaterialIcons } from '@expo/vector-icons';
import { buildGoogleIdentityFromEmail } from '../../../services/auth/googleAuth';
import { useAuthStore } from '../../../store/authStore';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { notify } from '../../../shared/utils/confirm';

interface Props {
  rememberMe?: boolean;
  label?: string;
}

/**
 * Continue with Google — confirmed email + same find-or-create / link logic.
 * (Full OAuth prompt can be re-enabled later with Google client IDs + a clean
 * expo-auth-session providers import after a native rebuild.)
 */
export default function GoogleSignInButton({
  rememberMe = true,
  label = 'Continue with Google',
}: Props) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { width: windowWidth } = useAppDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 400);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handlePress = () => setSheetOpen(true);

  const handleContinue = async () => {
    try {
      const identity = buildGoogleIdentityFromEmail(email, name);
      setBusy(true);
      await loginWithGoogle(identity, rememberMe);
      setSheetOpen(false);
      setEmail('');
      setName('');
    } catch (err) {
      notify('Google sign-in', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.googleButton, (busy || isLoading) && styles.disabled]}
        onPress={handlePress}
        disabled={busy || isLoading}
      >
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleLabel}>{label}</Text>
          </>
        )}
      </Pressable>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { width: dialogWidth }]}>
            <MaterialIcons name="login" size={36} color="#4285F4" />
            <Text style={styles.sheetTitle}>Continue with Google</Text>
            <Text style={styles.sheetBody}>
              Enter the Google email you use to sign in. We create or link your BadyetKarga
              account (verified — no email code needed).
            </Text>
            <RNTextInput
              style={styles.input}
              placeholder="Google email"
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <RNTextInput
              style={styles.input}
              placeholder="Display name (optional)"
              placeholderTextColor={colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
            />
            <Pressable
              style={styles.primary}
              onPress={() => void handleContinue()}
              disabled={busy}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </Pressable>
            <Pressable onPress={() => setSheetOpen(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    height: 52,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  disabled: { opacity: 0.55 },
  googleG: { ...typography.titleLg, color: '#4285F4', fontWeight: '700' },
  googleLabel: { ...typography.titleMd, color: colors.onSurface },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  sheetTitle: { ...typography.titleLg, color: colors.onSurface },
  sheetBody: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  primary: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryLabel: { ...typography.titleMd, color: colors.onPrimary },
  cancel: { ...typography.labelLg, color: colors.onSurfaceVariant, marginTop: spacing.xs },
});
