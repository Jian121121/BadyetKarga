import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useAppDimensions } from '../../../shared/utils/appDimensions';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import BrandLogo from '../../../shared/components/BrandLogo';
import TextInput from '../../../shared/components/TextInput';
import { digitsOnly } from '../../../shared/utils/validation';
import { notify } from '../../../shared/utils/confirm';
import {
  normalizeGmail,
  firebaseEmailRegistered,
} from '../../../services/auth/firebaseAuthService';
import { sendVerificationCode, verifyCode } from '../../../services/auth/otpEmailService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useAppDimensions();
  const modalWidth = Math.min(windowWidth - 48, 420);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [creating, setCreating] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingGmail, setPendingGmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const { isLoading, error, clearError, register } = useAuthStore();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]);

  const sendOtpTo = async (gmail: string, { openModal }: { openModal: boolean }) => {
    setSendingOtp(true);
    setModalError(null);
    setLocalError(null);
    try {
      await sendVerificationCode(gmail);
      setEmail(gmail);
      setPendingGmail(gmail);
      setOtp('');
      setCooldown(60);
      if (openModal) setOtpModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send the verification code.';
      if (openModal || otpModalOpen) setModalError(message);
      else setLocalError(message);
    } finally {
      setSendingOtp(false);
    }
  };

  const validateForm = (): string | null => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      return 'Please fill in all fields.';
    }
    try {
      normalizeGmail(email);
    } catch (err) {
      return err instanceof Error ? err.message : 'Use a valid @gmail.com address.';
    }
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!agreedToTerms) return 'Please agree to the Terms of Service and Privacy Policy.';
    return null;
  };

  const handleCreateAccount = async () => {
    clearError();
    setLocalError(null);
    if (isLoading || sendingOtp || creating) return;

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const gmail = normalizeGmail(email);
    if (await firebaseEmailRegistered(gmail)) {
      setLocalError('An account with this Gmail already exists. Please log in instead.');
      return;
    }
    await sendOtpTo(gmail, { openModal: true });
  };

  const handleResendCode = async () => {
    if (!pendingGmail || sendingOtp || cooldown > 0) return;
    await sendOtpTo(pendingGmail, { openModal: false });
  };

  const handleVerifyAndCreate = async () => {
    clearError();
    setModalError(null);
    if (!pendingGmail || creating || isLoading) return;

    if (otp.length !== 6) {
      setModalError('Enter the 6-digit verification code.');
      return;
    }

    try {
      verifyCode(pendingGmail, otp);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'The code is invalid or expired.');
      return;
    }

    setCreating(true);
    try {
      const created = await register(fullName.trim(), pendingGmail, password);
      if (!created) {
        setModalError(useAuthStore.getState().error || 'Could not create the account.');
        return;
      }
      setOtpModalOpen(false);
      notify('Account created', 'Your email is verified. You can now log in.', () =>
        navigation.replace('Login')
      );
    } finally {
      setCreating(false);
    }
  };

  const closeOtpModal = () => {
    if (sendingOtp || creating || isLoading) return;
    setOtpModalOpen(false);
    setOtp('');
    setModalError(null);
  };

  const displayError = localError || error;
  const busy = isLoading || sendingOtp || creating;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.blobGreen} />
      <View style={styles.blobGold} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo style={styles.brandRow} />

          <Card style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Fill in your details. We’ll email a 6-digit code after you tap Create Account.
            </Text>

            <TextInput
              label="Full Name"
              value={fullName}
              placeholder="Enter your full name"
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setLocalError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="Enter your Gmail"
            />

            <View>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>

            <View>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                placeholder="Enter your password again"
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoComplete="new-password"
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={8}
              >
                <MaterialIcons
                  name={showConfirm ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>

            <View style={styles.termsRow}>
              <Pressable onPress={() => setAgreedToTerms((v) => !v)} hitSlop={8}>
                <MaterialIcons
                  name={agreedToTerms ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={agreedToTerms ? colors.primary : colors.outline}
                />
              </Pressable>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('LegalDocument', { document: 'terms' })}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('LegalDocument', { document: 'privacy' })}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>

            {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, busy && styles.disabled]}
              onPress={() => void handleCreateAccount()}
              disabled={busy}
            >
              {sendingOtp ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Text style={styles.primaryLabel}>Create Account</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
                </>
              )}
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </Pressable>
          </Card>

          <Text style={styles.footer}>© 2026 BadyetKarga. Smart Household Utility.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={otpModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeOtpModal}
        statusBarTranslucent
      >
        <View
          style={[
            styles.modalOverlay,
            {
              width: windowWidth,
              height: windowHeight,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeOtpModal} />
          <KeyboardAvoidingView
            style={[styles.modalKeyboard, { width: modalWidth, maxHeight: windowHeight * 0.9 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <View style={styles.modalCard}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalIconWrap}>
                  <MaterialIcons name="mark-email-read" size={28} color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Verify your email</Text>
                <Text style={styles.modalSubtitle}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.modalEmail}>{pendingGmail}</Text>
                </Text>

                <TextInput
                  label="Verification Code"
                  value={otp}
                  onChangeText={(value) => {
                    setOtp(digitsOnly(value).slice(0, 6));
                    setModalError(null);
                  }}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                />

                {modalError ? <Text style={styles.errorText}>{modalError}</Text> : null}

                <Pressable
                  style={[
                    styles.primaryButton,
                    (creating || isLoading || otp.length !== 6) && styles.disabled,
                  ]}
                  onPress={() => void handleVerifyAndCreate()}
                  disabled={creating || isLoading || otp.length !== 6}
                >
                  {creating || isLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.primaryLabel}>Verify & Create Account</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => void handleResendCode()}
                  disabled={sendingOtp || cooldown > 0}
                  style={styles.resendRow}
                  hitSlop={8}
                >
                  <Text style={[styles.resendText, (sendingOtp || cooldown > 0) && styles.muted]}>
                    {sendingOtp
                      ? 'Sending…'
                      : cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                  </Text>
                </Pressable>

                <Pressable onPress={closeOtpModal} disabled={creating || isLoading} hitSlop={8}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  card: { gap: 2 },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 36,
    padding: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  termsText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboard: {
    alignSelf: 'center',
    zIndex: 1,
  },
  modalCard: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  modalScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalIconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalEmail: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resendText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
  },
  muted: {
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  cancelText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
